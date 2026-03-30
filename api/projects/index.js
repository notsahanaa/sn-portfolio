import { getContentFromGitHub } from '../lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = await getContentFromGitHub();
    const projects = data.buildInPublic.projects.filter(p => p.visible);
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
