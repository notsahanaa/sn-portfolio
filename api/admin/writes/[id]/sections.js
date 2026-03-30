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

  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await readData();
    const topic = data.writes.topics.find(t => t.id === id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!topic.sections) {
      topic.sections = [];
    }

    const maxOrder = topic.sections.reduce((max, s) => Math.max(max, s.order || 0), 0);

    const newSection = {
      id: uuidv4(),
      title,
      content: content || '',
      order: maxOrder + 1
    };

    topic.sections.push(newSection);
    await writeData(data);

    return res.status(201).json(newSection);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
