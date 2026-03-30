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

  try {
    const data = await readData();
    const project = data.buildInPublic.projects.find(p => p.id === id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.method === 'POST') {
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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
