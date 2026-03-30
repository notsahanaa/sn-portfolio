import data from '../../data/content.json' with { type: 'json' };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const topics = data.writes.topics
      .filter(t => t.visible)
      .sort((a, b) => a.order - b.order)
      .map(({ sections, ...topic }) => ({
        ...topic,
        sectionCount: sections?.length || 0
      }));
    return res.status(200).json(topics);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
