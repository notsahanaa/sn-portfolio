import data from '../../data/content.json' with { type: 'json' };
import { getContentFromGitHub, saveContentToGitHub } from '../lib/github.js';

export default async function handler(req, res) {
  const slugParts = req.query.slug || [];

  try {
    // Defensive check: ensure data structure exists
    if (!data || !data.buildInPublic || !Array.isArray(data.buildInPublic.projects)) {
      console.error('Invalid data structure:', {
        hasData: !!data,
        hasBuildInPublic: !!(data && data.buildInPublic),
        hasProjects: !!(data && data.buildInPublic && data.buildInPublic.projects)
      });
      return res.status(500).json({ error: 'Data structure error' });
    }

    // GET /api/projects/[slug] - Get single project
    if (req.method === 'GET' && slugParts.length === 1) {
      const slug = slugParts[0];
      const project = data.buildInPublic.projects.find(p => p.slug === slug && p.visible);

      if (!project) {
        console.error('Project not found:', {
          requestedSlug: slug,
          availableSlugs: data.buildInPublic.projects.map(p => p.slug)
        });
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.status(200).json(project);
    }

    // POST /api/projects/[slug]/like - Like a project (uses GitHub API for persistence)
    if (req.method === 'POST' && slugParts.length === 2 && slugParts[1] === 'like') {
      const slug = slugParts[0];

      // Fetch latest data from GitHub for write operations
      const { data: liveData, sha } = await getContentFromGitHub();
      const project = liveData.buildInPublic.projects.find(p => p.slug === slug);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      project.likes = (project.likes || 0) + 1;
      await saveContentToGitHub(liveData, sha, `Like project: ${slug}`);
      return res.status(200).json({ likes: project.likes });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
