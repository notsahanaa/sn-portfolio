const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'notsahanaa';
const REPO_NAME = 'sn-portfolio';
const FILE_PATH = 'data/content.json';

export async function getContentFromGitHub() {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const file = await response.json();
  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: file.sha };
}

export async function saveContentToGitHub(data, sha, message) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || 'Update content via admin',
        content,
        sha
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to save to GitHub: ${JSON.stringify(error)}`);
  }

  return response.json();
}
