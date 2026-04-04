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

export const getProjectsPageMeta = () => request('/projects/meta');

export const likeProject = (slug) => request(`/projects/${slug}/like`, { method: 'POST' });

// Auth
export const login = (password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });

// Admin endpoints

// Meta endpoints
export const getWritesMeta = () => request('/admin/writes/meta');

export const updateWritesMeta = (data) =>
  request('/admin/writes/meta', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const getProjectsMeta = () => request('/admin/projects/meta');

export const updateProjectsMeta = (data) =>
  request('/admin/projects/meta', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// Projects
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

// ============ WRITES ENDPOINTS ============

// Public
export const getTopics = () => request('/writes');

export const getTopic = (slug) => request(`/writes/${slug}`);

export const getWritesPageMeta = () => request('/writes/meta');

// Admin - Topics
export const getAdminTopics = () => request('/admin/writes');

export const createTopic = (data) =>
  request('/admin/writes', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateTopic = (id, data) =>
  request(`/admin/writes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteTopic = (id) =>
  request(`/admin/writes/${id}`, { method: 'DELETE' });

// Admin - Sections
export const createSection = (topicId, data) =>
  request(`/admin/writes/${topicId}/sections`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateSection = (topicId, sectionId, data) =>
  request(`/admin/writes/${topicId}/sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteSection = (topicId, sectionId) =>
  request(`/admin/writes/${topicId}/sections/${sectionId}`, { method: 'DELETE' });

// Admin - Uploads
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('adminToken');
  const response = await fetch('/api/admin/uploads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
};
