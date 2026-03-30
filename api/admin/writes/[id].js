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
    const topic = data.writes.topics.find(t => t.id === id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (req.method === 'PUT') {
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

      await writeData(data);
      return res.status(200).json(topic);
    }

    if (req.method === 'DELETE') {
      const index = data.writes.topics.findIndex(t => t.id === id);
      data.writes.topics.splice(index, 1);
      await writeData(data);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
