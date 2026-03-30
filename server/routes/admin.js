import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData, findProjectById, findTopicById } from '../data.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// GET /api/admin/projects - List ALL projects (including hidden)
router.get('/projects', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.buildInPublic.projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// POST /api/admin/projects - Create project
router.post('/projects', async (req, res) => {
  try {
    const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const data = await readData();

    // Check slug uniqueness
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
    await writeData(data);

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/admin/projects/:id - Update project
router.put('/projects/:id', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

    // Check slug uniqueness if changing
    if (slug && slug !== project.slug) {
      if (data.buildInPublic.projects.some(p => p.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      project.slug = slug;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status !== undefined) project.status = status;
    if (link !== undefined) project.link = link;
    if (visible !== undefined) project.visible = visible;

    await writeData(data);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/admin/projects/:id - Delete project
router.delete('/projects/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.buildInPublic.projects.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    data.buildInPublic.projects.splice(index, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/admin/projects/:id/tweets - Add tweet
router.post('/projects/:id/tweets', async (req, res) => {
  try {
    const { tweetUrl } = req.body;

    if (!tweetUrl) {
      return res.status(400).json({ error: 'Tweet URL required' });
    }

    // Basic Twitter/X URL validation
    const twitterPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!twitterPattern.test(tweetUrl)) {
      return res.status(400).json({ error: 'Invalid Twitter/X URL format' });
    }

    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newTweet = {
      id: uuidv4(),
      tweetUrl,
      addedAt: new Date().toISOString()
    };

    project.tweets.push(newTweet);
    await writeData(data);

    res.status(201).json(newTweet);
  } catch (error) {
    console.error('Error adding tweet:', error);
    res.status(500).json({ error: 'Failed to add tweet' });
  }
});

// DELETE /api/admin/projects/:id/tweets/:tweetId - Remove tweet
router.delete('/projects/:id/tweets/:tweetId', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tweetIndex = project.tweets.findIndex(t => t.id === req.params.tweetId);

    if (tweetIndex === -1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    project.tweets.splice(tweetIndex, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing tweet:', error);
    res.status(500).json({ error: 'Failed to remove tweet' });
  }
});

// ============ WRITES ENDPOINTS ============

// GET /api/admin/writes - List all topics (including hidden)
router.get('/writes', async (req, res) => {
  try {
    const data = await readData();
    const topics = data.writes.topics.sort((a, b) => a.order - b.order);
    res.json(topics);
  } catch (error) {
    console.error('Error reading topics:', error);
    res.status(500).json({ error: 'Failed to read topics' });
  }
});

// POST /api/admin/writes - Create topic
router.post('/writes', async (req, res) => {
  try {
    const { name, slug, description, visible } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const data = await readData();

    // Check slug uniqueness
    if (data.writes.topics.some(t => t.slug === slug)) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Calculate next order
    const maxOrder = data.writes.topics.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const newTopic = {
      id: uuidv4(),
      slug,
      name,
      description: description || '',
      visible: visible !== false,
      order: maxOrder + 1,
      sections: []
    };

    data.writes.topics.push(newTopic);
    await writeData(data);

    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// PUT /api/admin/writes/:id - Update topic
router.put('/writes/:id', async (req, res) => {
  try {
    const data = await readData();
    const topic = findTopicById(data, req.params.id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const { name, slug, description, visible, order } = req.body;

    // Check slug uniqueness if changing
    if (slug && slug !== topic.slug) {
      if (data.writes.topics.some(t => t.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      topic.slug = slug;
    }

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (visible !== undefined) topic.visible = visible;
    if (order !== undefined) topic.order = order;

    await writeData(data);
    res.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// DELETE /api/admin/writes/:id - Delete topic
router.delete('/writes/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.writes.topics.findIndex(t => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    data.writes.topics.splice(index, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// POST /api/admin/writes/:id/sections - Add section
router.post('/writes/:id/sections', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const data = await readData();
    const topic = findTopicById(data, req.params.id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!topic.sections) {
      topic.sections = [];
    }

    // Calculate next order
    const maxOrder = topic.sections.reduce((max, s) => Math.max(max, s.order || 0), 0);

    const newSection = {
      id: uuidv4(),
      title,
      content: content || '',
      order: maxOrder + 1
    };

    topic.sections.push(newSection);
    await writeData(data);

    res.status(201).json(newSection);
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
});

// PUT /api/admin/writes/:id/sections/:sectionId - Update section
router.put('/writes/:id/sections/:sectionId', async (req, res) => {
  try {
    const data = await readData();
    const topic = findTopicById(data, req.params.id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const section = topic.sections?.find(s => s.id === req.params.sectionId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const { title, content, order } = req.body;

    if (title !== undefined) section.title = title;
    if (content !== undefined) section.content = content;
    if (order !== undefined) section.order = order;

    await writeData(data);
    res.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// DELETE /api/admin/writes/:id/sections/:sectionId - Delete section
router.delete('/writes/:id/sections/:sectionId', async (req, res) => {
  try {
    const data = await readData();
    const topic = findTopicById(data, req.params.id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const sectionIndex = topic.sections?.findIndex(s => s.id === req.params.sectionId);

    if (sectionIndex === -1 || sectionIndex === undefined) {
      return res.status(404).json({ error: 'Section not found' });
    }

    topic.sections.splice(sectionIndex, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

export default router;
