import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await readData();
    const projects = data.buildInPublic.projects.filter(p => p.visible);
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
