import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

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

  const { id } = req.query;

  try {
    const data = await readData();
    const project = data.buildInPublic.projects.find(p => p.id === id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.method === 'PUT') {
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

    if (req.method === 'DELETE') {
      const index = data.buildInPublic.projects.findIndex(p => p.id === id);
      data.buildInPublic.projects.splice(index, 1);
      await writeData(data);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
