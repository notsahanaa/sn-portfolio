import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getContentFromGitHub, saveContentToGitHub } from '../../lib/github.js';

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

  // Handle Vercel's catch-all parameter format (can be "params" or "...params", string or array)
  const rawParams = req.query.params ?? req.query['...params'];
  const params = Array.isArray(rawParams) ? rawParams : (rawParams ? [rawParams] : []);

  try {
    const { data, sha } = await getContentFromGitHub();

    // PUT /api/admin/writes/[id] - Update topic
    if (req.method === 'PUT' && params.length === 1) {
      const id = params[0];
      const topic = data.writes.topics.find(t => t.id === id);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const { name, slug, description, visible, order } = req.body;

      if (slug && slug !== topic.slug) {
        if (data.writes.topics.some(t => t.slug === slug)) {
          return res.status(400).json({ error: 'Slug already exists' });
        }
        topic.slug = slug;
      }

      if (name !== undefined) topic.name = name;
      if (description !== undefined) topic.description = description;
      if (visible !== undefined) topic.visible = visible;
      if (order !== undefined) topic.order = order;

      await saveContentToGitHub(data, sha, `Update topic: ${topic.name}`);
      return res.status(200).json(topic);
    }

    // DELETE /api/admin/writes/[id] - Delete topic
    if (req.method === 'DELETE' && params.length === 1) {
      const id = params[0];
      const index = data.writes.topics.findIndex(t => t.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const topicName = data.writes.topics[index].name;
      data.writes.topics.splice(index, 1);
      await saveContentToGitHub(data, sha, `Delete topic: ${topicName}`);
      return res.status(200).json({ success: true });
    }

    // POST /api/admin/writes/[id]/sections - Add section
    if (req.method === 'POST' && params.length === 2 && params[1] === 'sections') {
      const id = params[0];
      const topic = data.writes.topics.find(t => t.id === id);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const { title, content } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!topic.sections) topic.sections = [];
      const maxOrder = topic.sections.reduce((max, s) => Math.max(max, s.order || 0), 0);

      const newSection = {
        id: uuidv4(),
        title,
        content: content || '',
        order: maxOrder + 1
      };

      topic.sections.push(newSection);
      await saveContentToGitHub(data, sha, `Add section to topic: ${topic.name}`);
      return res.status(201).json(newSection);
    }

    // PUT /api/admin/writes/[id]/sections/[sectionId] - Update section
    if (req.method === 'PUT' && params.length === 3 && params[1] === 'sections') {
      const [id, , sectionId] = params;
      const topic = data.writes.topics.find(t => t.id === id);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const section = topic.sections?.find(s => s.id === sectionId);
      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const { title, content, order } = req.body;
      if (title !== undefined) section.title = title;
      if (content !== undefined) section.content = content;
      if (order !== undefined) section.order = order;

      await saveContentToGitHub(data, sha, `Update section in topic: ${topic.name}`);
      return res.status(200).json(section);
    }

    // DELETE /api/admin/writes/[id]/sections/[sectionId] - Delete section
    if (req.method === 'DELETE' && params.length === 3 && params[1] === 'sections') {
      const [id, , sectionId] = params;
      const topic = data.writes.topics.find(t => t.id === id);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const sectionIndex = topic.sections?.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1 || sectionIndex === undefined) {
        return res.status(404).json({ error: 'Section not found' });
      }

      topic.sections.splice(sectionIndex, 1);
      await saveContentToGitHub(data, sha, `Delete section from topic: ${topic.name}`);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
