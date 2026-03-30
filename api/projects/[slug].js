import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await readData();
    const project = data.buildInPublic.projects.find(p => p.slug === slug && p.visible);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error reading project:', error);
    res.status(500).json({ error: 'Failed to read project' });
  }
}
