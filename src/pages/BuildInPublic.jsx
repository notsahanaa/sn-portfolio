import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProjects, getProject, getAdminProjects, createProject, updateProject, deleteProject, addTweet, removeTweet, updateProjectsMeta, getProjectsPageMeta } from '../api/client'
import { useAdmin } from '../context/AdminContext'
import EditableText from '../components/EditableText'
import InlineForm from '../components/InlineForm'
import TweetEmbed from '../components/TweetEmbed'
import LikeButton from '../components/LikeButton'
import '../styles/BuildInPublic.css'
import '../styles/EditMode.css'

const STATUS_LABELS = {
  'idea': 'idea',
  'active': 'active',
  'building': 'building',
  'in-progress': 'in progress',
  'paused': 'paused',
  'completed': 'completed',
  'abandoned': 'abandoned'
}

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

function BuildInPublic() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, isEditMode } = useAdmin()

  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Page meta
  const [pageMeta, setPageMeta] = useState({
    heading: 'things i build in public',
    subheading: 'i tinker and build for fun and share them on X. here\'s a collection of everything i\'ve built in public.'
  })

  // Edit mode state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectFormData, setProjectFormData] = useState(INITIAL_PROJECT)
  const [newTweetUrl, setNewTweetUrl] = useState('')

  const formatDate = (dateStr) => {
    if (!dateStr) return 'present'
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
    const year = date.getFullYear()
    return `${month} ${year}`
  }

  // Fetch page meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await getProjectsPageMeta()
        setPageMeta(meta)
      } catch (err) {
        console.error('Failed to fetch meta:', err)
      }
    }
    fetchMeta()
  }, [])

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const data = isLoggedIn ? await getAdminProjects() : await getProjects()
      setProjects(data)

      if (!slug && data.length > 0) {
        navigate(`/projects/${data[0].slug}`, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    }
  }, [isLoggedIn, slug, navigate])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Fetch current project when slug changes
  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      setLoading(true)
      try {
        const data = await getProject(slug)
        setCurrentProject(data)
      } catch (err) {
        setError(err.message)
        setCurrentProject(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [slug])

  // Handle page meta updates
  const handleMetaUpdate = async (field, value) => {
    try {
      await updateProjectsMeta({ [field]: value })
      setPageMeta(prev => ({ ...prev, [field]: value }))
    } catch (err) {
      setError(err.message)
    }
  }

  // Create project
  const handleCreateProject = async () => {
    try {
      const newProject = await createProject(projectFormData)
      setProjects([...projects, newProject])
      setShowAddForm(false)
      setProjectFormData(INITIAL_PROJECT)
      navigate(`/projects/${newProject.slug}`)
    } catch (err) {
      setError(err.message)
    }
  }

  // Update project
  const handleUpdateProject = async () => {
    try {
      const updated = await updateProject(editingProjectId, projectFormData)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      if (currentProject?.id === updated.id) {
        setCurrentProject(updated)
      }
      setEditingProjectId(null)
      setProjectFormData(INITIAL_PROJECT)
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete project
  const handleDeleteProject = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      await deleteProject(id)
      const remaining = projects.filter(p => p.id !== id)
      setProjects(remaining)
      if (currentProject?.id === id && remaining.length > 0) {
        navigate(`/projects/${remaining[0].slug}`)
      } else if (remaining.length === 0) {
        setCurrentProject(null)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Start editing a project
  const startEditingProject = (project) => {
    setEditingProjectId(project.id)
    setProjectFormData({
      name: project.name,
      slug: project.slug,
      description: project.description || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status || 'idea',
      link: project.link || '',
      visible: project.visible
    })
    setShowAddForm(false)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingProjectId(null)
    setProjectFormData(INITIAL_PROJECT)
    setShowAddForm(false)
  }

  // Update project inline fields
  const handleProjectFieldUpdate = async (field, value) => {
    if (!currentProject) return
    try {
      const updated = await updateProject(currentProject.id, { [field]: value })
      setCurrentProject(updated)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
    } catch (err) {
      setError(err.message)
    }
  }

  // Add tweet
  const handleAddTweet = async () => {
    if (!newTweetUrl.trim() || !currentProject) return
    try {
      const tweet = await addTweet(currentProject.id, newTweetUrl)
      const updated = { ...currentProject, tweets: [...currentProject.tweets, tweet] }
      setCurrentProject(updated)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setNewTweetUrl('')
    } catch (err) {
      setError(err.message)
    }
  }

  // Remove tweet
  const handleRemoveTweet = async (tweetId) => {
    if (!currentProject) return
    try {
      await removeTweet(currentProject.id, tweetId)
      const updated = { ...currentProject, tweets: currentProject.tweets.filter(t => t.id !== tweetId) }
      setCurrentProject(updated)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading && !currentProject) {
    return (
      <div className="build-in-public">
        <div className="projects-loading">loading...</div>
      </div>
    )
  }

  if (projects.length === 0 && !loading && !isEditMode) {
    return (
      <div className="build-in-public">
        <nav className="breadcrumb">
          <Link to="/">home</Link> / projects
        </nav>
        <div className="projects-empty">nothing here yet.</div>
      </div>
    )
  }

  return (
    <div className="build-in-public">
      {isEditMode && (
        <div className="edit-mode-indicator">editing mode</div>
      )}

      <nav className="breadcrumb">
        <Link to="/">home</Link> / <Link to="/projects">projects</Link>
        {currentProject && <> / {currentProject.name}</>}
      </nav>

      {error && <div className="projects-empty">{error}</div>}

      <div className="projects-layout">
        {/* Left sidebar */}
        <aside className="projects-sidebar">
          <div className="sidebar-header">
            <EditableText
              value={pageMeta.heading}
              onChange={(val) => handleMetaUpdate('heading', val)}
              as="h1"
              placeholder="Page heading"
            />
            <EditableText
              value={pageMeta.subheading}
              onChange={(val) => handleMetaUpdate('subheading', val)}
              as="p"
              placeholder="Page subheading"
              multiline
            />
          </div>

          <ul className="project-list">
            {projects.map(project => (
              <li key={project.id}>
                {isEditMode ? (
                  <div className="sidebar-item-wrapper">
                    <Link
                      to={`/projects/${project.slug}`}
                      className={slug === project.slug ? 'active' : ''}
                    >
                      {project.name}
                      {!project.visible && <span className="hidden-indicator"> (hidden)</span>}
                    </Link>
                    <div className="sidebar-item-controls">
                      <button
                        className="sidebar-item-control"
                        onClick={() => startEditingProject(project)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="sidebar-item-control danger"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={`/projects/${project.slug}`}
                    className={slug === project.slug ? 'active' : ''}
                  >
                    {project.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Inline edit form */}
          {isEditMode && editingProjectId && (
            <InlineForm
              isOpen={true}
              onSubmit={handleUpdateProject}
              onCancel={cancelEditing}
              submitLabel="update"
            >
              <div className="inline-form-field">
                <label>name</label>
                <input
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>slug</label>
                <input
                  type="text"
                  value={projectFormData.slug}
                  onChange={(e) => setProjectFormData({ ...projectFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>description</label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="inline-form-row">
                <div className="inline-form-field">
                  <label>status</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                  >
                    <option value="idea">idea</option>
                    <option value="in-progress">in progress</option>
                    <option value="building">building</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                    <option value="abandoned">abandoned</option>
                  </select>
                </div>
                <div className="inline-form-field">
                  <label>link</label>
                  <input
                    type="url"
                    value={projectFormData.link}
                    onChange={(e) => setProjectFormData({ ...projectFormData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="inline-form-row">
                <div className="inline-form-field">
                  <label>start date</label>
                  <input
                    type="date"
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                  />
                </div>
                <div className="inline-form-field">
                  <label>end date</label>
                  <input
                    type="date"
                    value={projectFormData.endDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="inline-form-checkbox">
                <input
                  type="checkbox"
                  id="visible"
                  checked={projectFormData.visible}
                  onChange={(e) => setProjectFormData({ ...projectFormData, visible: e.target.checked })}
                />
                <label htmlFor="visible">visible to public</label>
              </div>
            </InlineForm>
          )}

          {/* Add project button */}
          {isEditMode && !editingProjectId && !showAddForm && (
            <button className="add-button" onClick={() => setShowAddForm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              add project
            </button>
          )}

          {/* Add project form */}
          {isEditMode && showAddForm && (
            <InlineForm
              isOpen={true}
              onSubmit={handleCreateProject}
              onCancel={cancelEditing}
              submitLabel="create"
            >
              <div className="inline-form-field">
                <label>name</label>
                <input
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  placeholder="Project Name"
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>slug</label>
                <input
                  type="text"
                  value={projectFormData.slug}
                  onChange={(e) => setProjectFormData({ ...projectFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="project-slug"
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>description</label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div className="inline-form-row">
                <div className="inline-form-field">
                  <label>status</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })}
                  >
                    <option value="idea">idea</option>
                    <option value="in-progress">in progress</option>
                    <option value="building">building</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                    <option value="abandoned">abandoned</option>
                  </select>
                </div>
                <div className="inline-form-field">
                  <label>link</label>
                  <input
                    type="url"
                    value={projectFormData.link}
                    onChange={(e) => setProjectFormData({ ...projectFormData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="inline-form-row">
                <div className="inline-form-field">
                  <label>start date</label>
                  <input
                    type="date"
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                  />
                </div>
                <div className="inline-form-field">
                  <label>end date</label>
                  <input
                    type="date"
                    value={projectFormData.endDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="inline-form-checkbox">
                <input
                  type="checkbox"
                  id="new-visible"
                  checked={projectFormData.visible}
                  onChange={(e) => setProjectFormData({ ...projectFormData, visible: e.target.checked })}
                />
                <label htmlFor="new-visible">visible to public</label>
              </div>
            </InlineForm>
          )}
        </aside>

        {/* Right content area */}
        <main className="projects-content">
          {loading ? (
            <div className="projects-loading">loading...</div>
          ) : currentProject ? (
            <div className="project-detail">
              <header className="project-header">
                <div className="project-title-row">
                  <EditableText
                    value={currentProject.name}
                    onChange={(val) => handleProjectFieldUpdate('name', val)}
                    as="h2"
                    placeholder="Project name"
                  />
                  <LikeButton slug={slug} initialLikes={currentProject.likes} />
                </div>
                <EditableText
                  value={currentProject.description}
                  onChange={(val) => handleProjectFieldUpdate('description', val)}
                  as="p"
                  className="project-description"
                  placeholder="Project description"
                  multiline
                />
                <div className="project-meta">
                  {isEditMode ? (
                    <>
                      <select
                        className="status-select"
                        value={currentProject.status}
                        onChange={(e) => handleProjectFieldUpdate('status', e.target.value)}
                      >
                        <option value="idea">idea</option>
                        <option value="in-progress">in progress</option>
                        <option value="building">building</option>
                        <option value="active">active</option>
                        <option value="paused">paused</option>
                        <option value="completed">completed</option>
                        <option value="abandoned">abandoned</option>
                      </select>
                      <span className="meta-separator">|</span>
                      <input
                        type="date"
                        className="date-input"
                        value={currentProject.startDate || ''}
                        onChange={(e) => handleProjectFieldUpdate('startDate', e.target.value)}
                      />
                      <span>-</span>
                      <input
                        type="date"
                        className="date-input"
                        value={currentProject.endDate || ''}
                        onChange={(e) => handleProjectFieldUpdate('endDate', e.target.value)}
                        placeholder="ongoing"
                      />
                    </>
                  ) : (
                    <>
                      <span className={`status-text status-${currentProject.status}`}>
                        {STATUS_LABELS[currentProject.status] || currentProject.status}
                      </span>
                      <span className="meta-separator">|</span>
                      <span className="date-range">
                        {formatDate(currentProject.startDate)} - {formatDate(currentProject.endDate)}
                      </span>
                    </>
                  )}
                  {currentProject.link && (
                    <>
                      <span className="meta-separator">|</span>
                      <a
                        href={currentProject.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="visit-link"
                      >
                        visit →
                      </a>
                    </>
                  )}
                </div>
              </header>

              <section className="posts-section">
                {/* Add tweet input in edit mode */}
                {isEditMode && (
                  <div className="add-tweet-section">
                    <input
                      type="url"
                      placeholder="Paste tweet URL (https://x.com/...)"
                      value={newTweetUrl}
                      onChange={(e) => setNewTweetUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTweet())}
                      className="add-tweet-input"
                    />
                    <button onClick={handleAddTweet} className="add-tweet-button">
                      add tweet
                    </button>
                  </div>
                )}

                {currentProject.tweets && currentProject.tweets.length > 0 ? (
                  <div className="posts-timeline">
                    {currentProject.tweets.map(tweet => (
                      <div key={tweet.id} className="tweet-wrapper">
                        <TweetEmbed tweetUrl={tweet.tweetUrl} />
                        {isEditMode && (
                          <button
                            className="remove-tweet-button"
                            onClick={() => handleRemoveTweet(tweet.id)}
                            title="Remove tweet"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="projects-empty">no posts yet.</div>
                )}
              </section>
            </div>
          ) : projects.length === 0 && isEditMode ? (
            <div className="projects-empty">add a project to get started.</div>
          ) : (
            <div className="projects-empty">project not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BuildInPublic
