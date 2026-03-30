import express from 'express';
import { readData, getVisibleTopics, findTopicBySlug } from '../data.js';

const router = express.Router();

// GET /api/writes - List visible topics
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    const topics = getVisibleTopics(data);
    // Return topics without full section content for list view
    const topicsWithoutContent = topics.map(({ sections, ...topic }) => ({
      ...topic,
      sectionCount: sections?.length || 0
    }));
    res.json(topicsWithoutContent);
  } catch (error) {
    console.error('Error reading topics:', error);
    res.status(500).json({ error: 'Failed to read topics' });
  }
});

// GET /api/writes/:slug - Get single topic with sections
router.get('/:slug', async (req, res) => {
  try {
    const data = await readData();
    const topic = findTopicBySlug(data, req.params.slug);

    if (!topic || !topic.visible) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Sort sections by order
    const sortedTopic = {
      ...topic,
      sections: (topic.sections || []).sort((a, b) => a.order - b.order)
    };

    res.json(sortedTopic);
  } catch (error) {
    console.error('Error reading topic:', error);
    res.status(500).json({ error: 'Failed to read topic' });
  }
});

export default router;
