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

  try {
    const data = await readData();

    if (req.method === 'GET') {
      const topics = data.writes.topics.sort((a, b) => a.order - b.order);
      return res.status(200).json(topics);
    }

    if (req.method === 'POST') {
      const { name, slug, description, visible } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      if (data.writes.topics.some(t => t.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      const maxOrder = data.writes.topics.reduce((max, t) => Math.max(max, t.order || 0), 0);

      const newTopic = {
        id: uuidv4(),
        slug,
        name,
        description: description || '',
        visible: visible !== false,
        order: maxOrder + 1,
        sections: []
      };

      data.writes.topics.push(newTopic);
      await writeData(data);

      return res.status(201).json(newTopic);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
