const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Public endpoints
export const getProjects = () => request('/projects');

export const getProject = (slug) => request(`/projects/${slug}`);

export const likeProject = (slug) => request(`/projects/${slug}/like`, { method: 'POST' });

// Auth
export const login = (password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });

// Admin endpoints
export const getAdminProjects = () => request('/admin/projects');

export const createProject = (data) =>
  request('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateProject = (id, data) =>
  request(`/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteProject = (id) =>
  request(`/admin/projects/${id}`, { method: 'DELETE' });

export const addTweet = (projectId, tweetUrl) =>
  request(`/admin/projects/${projectId}/tweets`, {
    method: 'POST',
    body: JSON.stringify({ tweetUrl })
  });

export const removeTweet = (projectId, tweetId) =>
  request(`/admin/projects/${projectId}/tweets/${tweetId}`, { method: 'DELETE' });
