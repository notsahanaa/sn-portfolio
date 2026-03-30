import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const params = req.query.params || [];

  try {
    const data = await readData();

    // GET /api/admin/projects - List all projects
    if (req.method === 'GET' && params.length === 0) {
      return res.status(200).json(data.buildInPublic.projects);
    }

    // POST /api/admin/projects - Create project
    if (req.method === 'POST' && params.length === 0) {
      const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      if (data.buildInPublic.projects.some(p => p.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      const newProject = {
        id: uuidv4(),
        slug,
        name,
        description: description || '',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || null,
        status: status || 'idea',
        link: link || '',
        visible: visible !== false,
        likes: 0,
        tweets: []
      };

      data.buildInPublic.projects.push(newProject);
      await writeData(data);
      return res.status(201).json(newProject);
    }

    // PUT /api/admin/projects/[id] - Update project
    if (req.method === 'PUT' && params.length === 1) {
      const id = params[0];
      const project = data.buildInPublic.projects.find(p => p.id === id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

      if (slug && slug !== project.slug) {
        if (data.buildInPublic.projects.some(p => p.slug === slug)) {
          return res.status(400).json({ error: 'Slug already exists' });
        }
        project.slug = slug;
      }

      if (name !== undefined) project.name = name;
      if (description !== undefined) project.description = description;
      if (startDate !== undefined) project.startDate = startDate;
      if (endDate !== undefined) project.endDate = endDate;
      if (status !== undefined) project.status = status;
      if (link !== undefined) project.link = link;
      if (visible !== undefined) project.visible = visible;

      await writeData(data);
      return res.status(200).json(project);
    }

    // DELETE /api/admin/projects/[id] - Delete project
    if (req.method === 'DELETE' && params.length === 1) {
      const id = params[0];
      const index = data.buildInPublic.projects.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }

      data.buildInPublic.projects.splice(index, 1);
      await writeData(data);
      return res.status(200).json({ success: true });
    }

    // POST /api/admin/projects/[id]/tweets - Add tweet
    if (req.method === 'POST' && params.length === 2 && params[1] === 'tweets') {
      const id = params[0];
      const project = data.buildInPublic.projects.find(p => p.id === id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { tweetUrl } = req.body;
      if (!tweetUrl) {
        return res.status(400).json({ error: 'Tweet URL required' });
      }

      const twitterPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
      if (!twitterPattern.test(tweetUrl)) {
        return res.status(400).json({ error: 'Invalid Twitter/X URL format' });
      }

      const newTweet = {
        id: uuidv4(),
        tweetUrl,
        addedAt: new Date().toISOString()
      };

      project.tweets.push(newTweet);
      await writeData(data);
      return res.status(201).json(newTweet);
    }

    // DELETE /api/admin/projects/[id]/tweets/[tweetId] - Delete tweet
    if (req.method === 'DELETE' && params.length === 3 && params[1] === 'tweets') {
      const [id, , tweetId] = params;
      const project = data.buildInPublic.projects.find(p => p.id === id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const tweetIndex = project.tweets.findIndex(t => t.id === tweetId);
      if (tweetIndex === -1) {
        return res.status(404).json({ error: 'Tweet not found' });
      }

      project.tweets.splice(tweetIndex, 1);
      await writeData(data);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
