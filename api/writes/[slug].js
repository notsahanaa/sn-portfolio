import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data/content.json');

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await readData();
    const topic = data.writes.topics.find(t => t.slug === slug);

    if (!topic || !topic.visible) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const sortedTopic = {
      ...topic,
      sections: (topic.sections || []).sort((a, b) => a.order - b.order)
    };

    res.status(200).json(sortedTopic);
  } catch (error) {
    console.error('Error reading topic:', error);
    res.status(500).json({ error: 'Failed to read topic' });
  }
}
