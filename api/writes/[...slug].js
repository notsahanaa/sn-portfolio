import data from '../../data/content.json' with { type: 'json' };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle catch-all route - slug is an array
  const slugParts = req.query.slug || [];
  if (slugParts.length !== 1) {
    return res.status(404).json({ error: 'Not found' });
  }
  const slug = slugParts[0];

  try {
    const topic = data.writes.topics.find(t => t.slug === slug);

    if (!topic || !topic.visible) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const sortedTopic = {
      ...topic,
      sections: (topic.sections || []).sort((a, b) => a.order - b.order)
    };
    return res.status(200).json(sortedTopic);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
