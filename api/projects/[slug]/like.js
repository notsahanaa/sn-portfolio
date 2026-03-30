import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await readData();
    const project = data.buildInPublic.projects.find(p => p.slug === slug);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.likes = (project.likes || 0) + 1;
    await writeData(data);

    res.status(200).json({ likes: project.likes });
  } catch (error) {
    console.error('Error liking project:', error);
    res.status(500).json({ error: 'Failed to like project' });
  }
}
