import express from 'express';
import { readData, getVisibleTopics, findTopicBySlug } from '../data.js';

const router = express.Router();

// GET /api/writes/meta - Get writes page heading/subheading (public)
router.get('/meta', async (req, res) => {
  try {
    const data = await readData();
    res.json({
      heading: data.writes.heading || 'writes',
      subheading: data.writes.subheading || ''
    });
  } catch (error) {
    console.error('Error reading writes meta:', error);
    res.status(500).json({ error: 'Failed to read writes meta' });
  }
});

// GET /api/writes - List visible topics
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    const topics = getVisibleTopics(data);
    // Return topics without full content for list view
    const topicsWithoutContent = topics.map(({ content, ...topic }) => ({
      ...topic,
      hasContent: !!content && content.trim().length > 0
    }));
    res.json(topicsWithoutContent);
  } catch (error) {
    console.error('Error reading topics:', error);
    res.status(500).json({ error: 'Failed to read topics' });
  }
});

// GET /api/writes/:slug - Get single topic with content
router.get('/:slug', async (req, res) => {
  try {
    const data = await readData();
    const topic = findTopicBySlug(data, req.params.slug);

    if (!topic || !topic.visible) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Error reading topic:', error);
    res.status(500).json({ error: 'Failed to read topic' });
  }
});

export default router;
