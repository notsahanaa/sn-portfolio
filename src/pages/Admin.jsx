import { useState, useEffect, useCallback } from 'react'
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  addTweet,
  removeTweet
} from '../api/client'
import AdminLogin from '../components/AdminLogin'
import '../styles/Admin.css'

const INITIAL_PROJECT = {
  name: '',
  slug: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  status: 'idea',
  link: '',
  visible: true
}

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState(INITIAL_PROJECT)
  const [newTweetUrl, setNewTweetUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setIsLoggedIn(false)
    setProjects([])
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getAdminProjects()
      setProjects(data)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        handleLogout()
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [handleLogout])

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects()
    }
  }, [isLoggedIn, fetchProjects])

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccess('')
    } else {
      setSuccess(msg)
      setError('')
    }
    setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      const newProject = await createProject(formData)
      setProjects([...projects, newProject])
      setFormData(INITIAL_PROJECT)
      showMessage('Project created!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateProject(editingProject.id, formData)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setEditingProject(null)
      setFormData(INITIAL_PROJECT)
      showMessage('Project updated!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      showMessage('Project deleted!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleToggleVisibility = async (project) => {
    try {
      const updated = await updateProject(project.id, { visible: !project.visible })
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleAddTweet = async (projectId) => {
    if (!newTweetUrl.trim()) return
    try {
      const tweet = await addTweet(projectId, newTweetUrl)
      setProjects(projects.map(p =>
        p.id === projectId
          ? { ...p, tweets: [...p.tweets, tweet] }
          : p
      ))
      setNewTweetUrl('')
      showMessage('Tweet added!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleRemoveTweet = async (projectId, tweetId) => {
    if (!confirm('Remove this tweet?')) return
    try {
      await removeTweet(projectId, tweetId)
      setProjects(projects.map(p =>
        p.id === projectId
          ? { ...p, tweets: p.tweets.filter(t => t.id !== tweetId) }
          : p
      ))
      showMessage('Tweet removed!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const startEditing = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      slug: project.slug,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate || '',
      status: project.status,
      link: project.link,
      visible: project.visible
    })
  }

  const cancelEditing = () => {
    setEditingProject(null)
    setFormData(INITIAL_PROJECT)
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <AdminLogin onLogin={() => setIsLoggedIn(true)} />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <section className="admin-section">
        <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="project-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="slug-for-url"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
              required
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
          <div className="form-row">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              placeholder="End date (optional)"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="idea">Idea</option>
              <option value="in-progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <input
            type="url"
            placeholder="Project URL (optional)"
            value={formData.link}
            onChange={(e) => setFormData({...formData, link: e.target.value})}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.visible}
              onChange={(e) => setFormData({...formData, visible: e.target.checked})}
            />
            Visible to public
          </label>
          <div className="form-actions">
            <button type="submit">{editingProject ? 'Update' : 'Create'} Project</button>
            {editingProject && <button type="button" onClick={cancelEditing}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>Projects ({projects.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : projects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className={`project-item ${!project.visible ? 'hidden' : ''}`}>
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <span className={`status-badge status-${project.status}`}>{project.status}</span>
                  {!project.visible && <span className="hidden-badge">Hidden</span>}
                </div>
                <div className="project-actions">
                  <button onClick={() => handleToggleVisibility(project)}>
                    {project.visible ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => startEditing(project)}>Edit</button>
                  <button onClick={() => handleDeleteProject(project.id)} className="danger">Delete</button>
                </div>

                <div className="tweets-manager">
                  <h4>Tweets ({project.tweets.length})</h4>
                  <div className="add-tweet">
                    <input
                      type="url"
                      placeholder="https://twitter.com/user/status/123..."
                      value={editingProject?.id === project.id ? '' : newTweetUrl}
                      onChange={(e) => setNewTweetUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTweet(project.id))}
                    />
                    <button onClick={() => handleAddTweet(project.id)}>Add</button>
                  </div>
                  {project.tweets.length > 0 && (
                    <ul className="tweet-list">
                      {project.tweets.map(tweet => (
                        <li key={tweet.id}>
                          <a href={tweet.tweetUrl} target="_blank" rel="noopener noreferrer">
                            {tweet.tweetUrl.substring(0, 50)}...
                          </a>
                          <button onClick={() => handleRemoveTweet(project.id, tweet.id)} className="danger small">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Admin
