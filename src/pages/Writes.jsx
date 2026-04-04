import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTopics, getTopic, getAdminTopics, createTopic, updateTopic, deleteTopic, updateWritesMeta, getWritesPageMeta } from '../api/client'
import { useAdmin } from '../context/AdminContext'
import EditableText from '../components/EditableText'
import InlineForm from '../components/InlineForm'
import RichTextEditor from '../components/RichTextEditor'
import DOMPurify from 'isomorphic-dompurify'
import '../styles/Writes.css'
import '../styles/EditMode.css'

const INITIAL_TOPIC = {
  name: '',
  slug: '',
  description: '',
  visible: true
}

function Writes() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, isEditMode } = useAdmin()

  const [topics, setTopics] = useState([])
  const [currentTopic, setCurrentTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Page meta
  const [pageMeta, setPageMeta] = useState({
    heading: 'writes',
    subheading: 'long form thoughts on technology, creativity, and building things'
  })

  // Edit mode state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [topicFormData, setTopicFormData] = useState(INITIAL_TOPIC)

  // Content editing state - local draft that doesn't auto-save
  const [draftContent, setDraftContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savingContent, setSavingContent] = useState(false)

  // Fetch page meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await getWritesPageMeta()
        setPageMeta(meta)
      } catch (err) {
        console.error('Failed to fetch meta:', err)
      }
    }
    fetchMeta()
  }, [])

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    try {
      const data = isLoggedIn ? await getAdminTopics() : await getTopics()
      setTopics(data)

      // If no slug provided and there are topics, redirect to first one
      if (!slug && data.length > 0) {
        navigate(`/writes/${data[0].slug}`, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    }
  }, [isLoggedIn, slug, navigate])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  // Fetch current topic when slug changes
  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    const fetchTopic = async () => {
      setLoading(true)
      try {
        const data = await getTopic(slug)
        setCurrentTopic(data)
        // Initialize draft with current content
        setDraftContent(data.content || '')
        setHasUnsavedChanges(false)
      } catch (err) {
        setError(err.message)
        setCurrentTopic(null)
      } finally {
        setLoading(false)
      }
    }
    fetchTopic()
  }, [slug])

  // Reset draft when entering/exiting edit mode
  useEffect(() => {
    if (currentTopic) {
      setDraftContent(currentTopic.content || '')
      setHasUnsavedChanges(false)
    }
  }, [isEditMode, currentTopic?.id])

  // Handle page meta updates
  const handleMetaUpdate = async (field, value) => {
    try {
      await updateWritesMeta({ [field]: value })
      setPageMeta(prev => ({ ...prev, [field]: value }))
    } catch (err) {
      setError(err.message)
    }
  }

  // Create topic
  const handleCreateTopic = async () => {
    try {
      const newTopic = await createTopic(topicFormData)
      setTopics([...topics, newTopic])
      setShowAddForm(false)
      setTopicFormData(INITIAL_TOPIC)
      navigate(`/writes/${newTopic.slug}`)
    } catch (err) {
      setError(err.message)
    }
  }

  // Update topic
  const handleUpdateTopic = async () => {
    try {
      const updated = await updateTopic(editingTopicId, topicFormData)
      setTopics(topics.map(t => t.id === updated.id ? updated : t))
      if (currentTopic?.id === updated.id) {
        setCurrentTopic(updated)
      }
      setEditingTopicId(null)
      setTopicFormData(INITIAL_TOPIC)
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete topic
  const handleDeleteTopic = async (id) => {
    if (!confirm('Delete this topic?')) return
    try {
      await deleteTopic(id)
      const remaining = topics.filter(t => t.id !== id)
      setTopics(remaining)
      if (currentTopic?.id === id && remaining.length > 0) {
        navigate(`/writes/${remaining[0].slug}`)
      } else if (remaining.length === 0) {
        setCurrentTopic(null)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Start editing a topic
  const startEditingTopic = (topic) => {
    setEditingTopicId(topic.id)
    setTopicFormData({
      name: topic.name,
      slug: topic.slug,
      description: topic.description || '',
      visible: topic.visible
    })
    setShowAddForm(false)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingTopicId(null)
    setTopicFormData(INITIAL_TOPIC)
    setShowAddForm(false)
  }

  // Handle content change - just update local draft, don't save
  const handleContentChange = (content) => {
    setDraftContent(content)
    // Check if content actually changed from saved version
    const savedContent = currentTopic?.content || ''
    setHasUnsavedChanges(content !== savedContent)
  }

  // Save content explicitly
  const handleSaveContent = async () => {
    if (!currentTopic || !hasUnsavedChanges) return
    setSavingContent(true)
    try {
      const updated = await updateTopic(currentTopic.id, { content: draftContent })
      setCurrentTopic(updated)
      setTopics(topics.map(t => t.id === updated.id ? updated : t))
      setHasUnsavedChanges(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingContent(false)
    }
  }

  // Discard changes
  const handleDiscardChanges = () => {
    if (!confirm('Discard unsaved changes?')) return
    setDraftContent(currentTopic?.content || '')
    setHasUnsavedChanges(false)
  }

  // Update topic name inline
  const handleTopicNameUpdate = async (name) => {
    if (!currentTopic) return
    try {
      const updated = await updateTopic(currentTopic.id, { name })
      setCurrentTopic(updated)
      setTopics(topics.map(t => t.id === updated.id ? updated : t))
    } catch (err) {
      setError(err.message)
    }
  }

  // Update topic description inline
  const handleTopicDescriptionUpdate = async (description) => {
    if (!currentTopic) return
    try {
      const updated = await updateTopic(currentTopic.id, { description })
      setCurrentTopic(updated)
      setTopics(topics.map(t => t.id === updated.id ? updated : t))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading && !currentTopic) {
    return (
      <div className="writes-page">
        <div className="writes-loading">loading...</div>
      </div>
    )
  }

  if (topics.length === 0 && !loading && !isEditMode) {
    return (
      <div className="writes-page">
        <nav className="writes-breadcrumb">
          <Link to="/">home</Link> / writes
        </nav>
        <div className="writes-empty">nothing here yet.</div>
      </div>
    )
  }

  return (
    <div className="writes-page">
      {isEditMode && (
        <div className="edit-mode-indicator">editing mode</div>
      )}

      <nav className="writes-breadcrumb">
        <Link to="/">home</Link> / <Link to="/writes">writes</Link>
        {currentTopic && <> / {currentTopic.name}</>}
      </nav>

      {error && <div className="writes-empty">{error}</div>}

      <div className="writes-layout">
        {/* Left sidebar */}
        <aside className="writes-sidebar">
          {/* Page heading - editable in edit mode */}
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

          {/* Topic list */}
          <ul className="topic-list">
            {topics.map(topic => (
              <li key={topic.id}>
                {isEditMode ? (
                  <div className="sidebar-item-wrapper">
                    <Link
                      to={`/writes/${topic.slug}`}
                      className={slug === topic.slug ? 'active' : ''}
                    >
                      {topic.name}
                      {!topic.visible && <span className="hidden-indicator"> (hidden)</span>}
                    </Link>
                    <div className="sidebar-item-controls">
                      <button
                        className="sidebar-item-control"
                        onClick={() => startEditingTopic(topic)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="sidebar-item-control danger"
                        onClick={() => handleDeleteTopic(topic.id)}
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
                    to={`/writes/${topic.slug}`}
                    className={slug === topic.slug ? 'active' : ''}
                  >
                    {topic.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Inline edit form */}
          {isEditMode && editingTopicId && (
            <InlineForm
              isOpen={true}
              onSubmit={handleUpdateTopic}
              onCancel={cancelEditing}
              submitLabel="update"
            >
              <div className="inline-form-field">
                <label>name</label>
                <input
                  type="text"
                  value={topicFormData.name}
                  onChange={(e) => setTopicFormData({ ...topicFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>slug</label>
                <input
                  type="text"
                  value={topicFormData.slug}
                  onChange={(e) => setTopicFormData({ ...topicFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>description</label>
                <textarea
                  value={topicFormData.description}
                  onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="inline-form-checkbox">
                <input
                  type="checkbox"
                  id="visible"
                  checked={topicFormData.visible}
                  onChange={(e) => setTopicFormData({ ...topicFormData, visible: e.target.checked })}
                />
                <label htmlFor="visible">visible to public</label>
              </div>
            </InlineForm>
          )}

          {/* Add topic button */}
          {isEditMode && !editingTopicId && !showAddForm && (
            <button className="add-button" onClick={() => setShowAddForm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              add topic
            </button>
          )}

          {/* Add topic form */}
          {isEditMode && showAddForm && (
            <InlineForm
              isOpen={true}
              onSubmit={handleCreateTopic}
              onCancel={cancelEditing}
              submitLabel="create"
            >
              <div className="inline-form-field">
                <label>name</label>
                <input
                  type="text"
                  value={topicFormData.name}
                  onChange={(e) => setTopicFormData({ ...topicFormData, name: e.target.value })}
                  placeholder="Topic Name"
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>slug</label>
                <input
                  type="text"
                  value={topicFormData.slug}
                  onChange={(e) => setTopicFormData({ ...topicFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="topic-slug"
                  required
                />
              </div>
              <div className="inline-form-field">
                <label>description</label>
                <textarea
                  value={topicFormData.description}
                  onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div className="inline-form-checkbox">
                <input
                  type="checkbox"
                  id="new-visible"
                  checked={topicFormData.visible}
                  onChange={(e) => setTopicFormData({ ...topicFormData, visible: e.target.checked })}
                />
                <label htmlFor="new-visible">visible to public</label>
              </div>
            </InlineForm>
          )}
        </aside>

        {/* Right content area */}
        <main className="writes-content">
          {loading ? (
            <div className="writes-loading">loading...</div>
          ) : currentTopic ? (
            <div className="topic-detail">
              {/* Topic header - editable in edit mode */}
              <header className="topic-header">
                <EditableText
                  value={currentTopic.name}
                  onChange={handleTopicNameUpdate}
                  as="h2"
                  className="topic-title"
                  placeholder="Topic name"
                />
                <EditableText
                  value={currentTopic.description}
                  onChange={handleTopicDescriptionUpdate}
                  as="p"
                  className="topic-description"
                  placeholder="Topic description"
                  multiline
                />
              </header>

              {/* Content area */}
              {isEditMode ? (
                <div className="edit-mode-editor">
                  {/* Save bar */}
                  <div className="editor-save-bar">
                    <div className="save-status">
                      {savingContent && <span className="saving-text">saving...</span>}
                      {hasUnsavedChanges && !savingContent && (
                        <span className="unsaved-text">unsaved changes</span>
                      )}
                      {!hasUnsavedChanges && !savingContent && (
                        <span className="saved-text">all changes saved</span>
                      )}
                    </div>
                    <div className="save-actions">
                      {hasUnsavedChanges && (
                        <>
                          <button
                            type="button"
                            className="discard-button"
                            onClick={handleDiscardChanges}
                            disabled={savingContent}
                          >
                            discard
                          </button>
                          <button
                            type="button"
                            className="save-button"
                            onClick={handleSaveContent}
                            disabled={savingContent}
                          >
                            {savingContent ? 'saving...' : 'save'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <RichTextEditor
                    content={draftContent}
                    onChange={handleContentChange}
                    placeholder="Start writing your content here..."
                  />
                </div>
              ) : (
                <div className="topic-content">
                  {currentTopic.content ? (
                    <div
                      className="section-content"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(currentTopic.content)
                      }}
                    />
                  ) : (
                    <div className="writes-empty">no content yet.</div>
                  )}
                </div>
              )}
            </div>
          ) : topics.length === 0 && isEditMode ? (
            <div className="writes-empty">add a topic to get started.</div>
          ) : (
            <div className="writes-empty">topic not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Writes
