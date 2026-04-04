import express from 'express';
import { readData, writeData, getVisibleProjects, findProjectBySlug } from '../data.js';

const router = express.Router();

// GET /api/projects/meta - Get projects page heading/subheading (public)
router.get('/meta', async (req, res) => {
  try {
    const data = await readData();
    res.json({
      heading: data.buildInPublic.heading || 'things i build in public',
      subheading: data.buildInPublic.subheading || ''
    });
  } catch (error) {
    console.error('Error reading projects meta:', error);
    res.status(500).json({ error: 'Failed to read projects meta' });
  }
});

// GET /api/projects - List visible projects
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    const projects = getVisibleProjects(data).map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      link: p.link,
      likes: p.likes,
      tweetCount: p.tweets.length
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// GET /api/projects/:slug - Get single project with tweets
router.get('/:slug', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectBySlug(data, req.params.slug);

    if (!project || !project.visible) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Sort tweets by addedAt descending (newest first)
    const sortedTweets = [...project.tweets].sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );

    res.json({
      ...project,
      tweets: sortedTweets
    });
  } catch (error) {
    console.error('Error reading project:', error);
    res.status(500).json({ error: 'Failed to read project' });
  }
});

// POST /api/projects/:slug/like - Increment like count
router.post('/:slug/like', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectBySlug(data, req.params.slug);

    if (!project || !project.visible) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.likes = (project.likes || 0) + 1;
    await writeData(data);

    res.json({ likes: project.likes });
  } catch (error) {
    console.error('Error updating likes:', error);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

export default router;
