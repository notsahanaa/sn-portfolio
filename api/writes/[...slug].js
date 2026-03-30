import { getContentFromGitHub } from '../lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle Vercel's catch-all parameter format (can be "slug" or "...slug", string or array)
  const rawSlug = req.query.slug ?? req.query['...slug'];
  const slugParts = Array.isArray(rawSlug) ? rawSlug : (rawSlug ? [rawSlug] : []);
  if (slugParts.length !== 1) {
    return res.status(404).json({ error: 'Not found' });
  }
  const slug = slugParts[0];

  try {
    const { data } = await getContentFromGitHub();
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
