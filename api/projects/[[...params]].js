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
  const params = req.query.params || [];

  try {
    const data = await readData();

    // GET /api/projects - List all visible projects
    if (req.method === 'GET' && params.length === 0) {
      const projects = data.buildInPublic.projects.filter(p => p.visible);
      return res.status(200).json(projects);
    }

    // GET /api/projects/[slug] - Get single project
    if (req.method === 'GET' && params.length === 1) {
      const slug = params[0];
      const project = data.buildInPublic.projects.find(p => p.slug === slug && p.visible);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.status(200).json(project);
    }

    // POST /api/projects/[slug]/like - Like a project
    if (req.method === 'POST' && params.length === 2 && params[1] === 'like') {
      const slug = params[0];
      const project = data.buildInPublic.projects.find(p => p.slug === slug);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      project.likes = (project.likes || 0) + 1;
      await writeData(data);
      return res.status(200).json({ likes: project.likes });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
