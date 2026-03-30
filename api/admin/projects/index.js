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

  try {
    const { data, sha } = await getContentFromGitHub();

    if (req.method === 'GET') {
      return res.status(200).json(data.buildInPublic.projects);
    }

    if (req.method === 'POST') {
      const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      if (data.buildInPublic.projects.some(p => p.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      const newProject = {
        id: uuidv4(),
        slug,
        name,
        description: description || '',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || null,
        status: status || 'idea',
        link: link || '',
        visible: visible !== false,
        likes: 0,
        tweets: []
      };

      data.buildInPublic.projects.push(newProject);
      await saveContentToGitHub(data, sha, `Add project: ${name}`);
      return res.status(201).json(newProject);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
