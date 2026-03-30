import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.query.params || [];

  try {
    const data = await readData();

    // GET /api/writes - List all visible topics
    if (params.length === 0) {
      const topics = data.writes.topics
        .filter(t => t.visible)
        .sort((a, b) => a.order - b.order)
        .map(({ sections, ...topic }) => ({
          ...topic,
          sectionCount: sections?.length || 0
        }));
      return res.status(200).json(topics);
    }

    // GET /api/writes/[slug] - Get single topic with sections
    if (params.length === 1) {
      const slug = params[0];
      const topic = data.writes.topics.find(t => t.slug === slug);

      if (!topic || !topic.visible) {
        return res.status(404).json({ error: 'Topic not found' });
      }

      const sortedTopic = {
        ...topic,
        sections: (topic.sections || []).sort((a, b) => a.order - b.order)
      };
      return res.status(200).json(sortedTopic);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
