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
        <div className="writes-placeholder">
          <header className="placeholder-header">
            <h1>paradigms</h1>
            <p className="placeholder-intro">
              i started asking what it meant to be a builder, a creator and broadly a human with a 1000 passionate ideas in today's world, this newsletter - paradigms - emerged. in this, i discuss the emerging paradigms in the ai era, and the movements and strides thought leaders and early adopters in this space are enabling.
            </p>
          </header>

          <section className="placeholder-section">
            <h2>on agentic coding & agent native products</h2>
            <p>
              there's been so much going on in the agentic space lately. back in june 2025, vibe coding felt hot. you could now turn your thoughts and ideas, sketches, and figma frames into products. you just had to learn the saas stack a little bit.
            </p>
            <p>
              enter january, things changed up a bit. we went from vibe coding to agentic coding. from writing prompts and stitching up parts → creating systems and pipelines for code to be created, reviewed, pushed and tested. being technical moved up the ladder from writing code to creating systems and software factories.
            </p>
            <p>
              a similar change in the product space. what is a product? this question shifted slightly. while previously the most popular saas products were web/mobile apps meant to aid interactions to get some job done, today the paradigm has shifted. interactions are cut down. so are touchpoints. you start. agents do and deliver results. interfaces are also being cut down. a lot of products can live in your slack. with these new emerging patterns, product and design folk need to start thinking in terms of "jobs to be done" and "granular actions" instead of "features". we also need to stop thinking of products as static objects we keep adding to, and as intelligent, evolving, recursive entities that can fine-tune themselves based on user-interaction and usage data (credit: appa).
            </p>
          </section>

          <section className="placeholder-section">
            <h2>a super-porous ecosystem</h2>
            <p>
              there's always been some amount of trade and "standing on the shoulders of a giant" in tech. libraries, open source communities, tech twitter, conferences and demos. but i think sharing what each other make has reached a whole new level now.
            </p>
            <p>
              previously if we built products, we built most of it in-house, on top of a few libraries and connected to a few external prod/services (posthog, sentry, etc) through APIs. now products can entirely be salads. a mix of products called in via mcps and interacting with one another. a bunch of skills and plugins downloaded from git repos. agents bought off of marketplaces.
            </p>
            <p>
              in this new agentic stack, products are almost emergent compositions of their individual atoms - prompts, tools, skills, agent orchestration patterns, and products wrapped in mcp. and these individual parts are physically, not chemically combined. they can be swapped and updated without breaking the rest of the building. and as is always the case with tech, the community is going hard on building at each level of this composition. the best builders will be the ones who know where to find them, how to combine them, and when to swap them out. so better start hunting down git repos for powerful atoms to borrow.
            </p>
          </section>

          <section className="placeholder-section">
            <h2>on art, aesthetics and meaning making</h2>
            <p>
              builders are taking on roles beyond just building products. they are becoming artists. they are asking questions about aesthetics, fonts and animations, y2k and glitches. they are bringing back stories and histories from the archives of the internet to narrate with their products. many products and websites have an almost rebellious angle to them; a setting, a persona, an experience that makes you feel like you belong to a certain ideology or cult. products and using them have become a form of engaging with ones identity.
            </p>
            <p>
              builders often go one step ahead of the product they build itself. there's so much investment in "aura". creating a killer demo video, adding photos from the build process, quotes lyrics and posters, and seeding their public pages with vibes. the process and the story of living through the product building is almost as important as the product now. people connect with the builders, not just with what they build. with the builders' ideas, values, vibes, narratives, moments, interactions and connections, their ecosystem. it is more important now than ever to be a robust "character" as a builder. builders and techies as nerds and geeks is obsolete.
            </p>
            <p>
              to this end, there's so much investment in systems for art. feeds and threads for cultivating taste, image and video generators, prompts and systems to teach ai taste, templates with stacks, ascii cards and web assets. there is more dialog here now from the tech-builder community than ever before.
            </p>
            <p>
              as everyone starts to build, "taste" has become the new skill gap. the pop-culture references, movies tv shows and video games you geeked over, history and art classes in highschool, little personal quirks, albums and lyrics, and nostalgic trends suddenly make you a hot cake. if you did not spend enough time in highschool geeking out, engaging in play/entertainment and building a personality, you should probably get started and go down rabbit holes now. this catching up can be very important to your success.
            </p>
          </section>

          <section className="placeholder-section">
            <h2>new behaviours and muscles</h2>
            <p>
              i've always thought of creating as a "Y-axis activity". a creator would pick something to work on, spend some time getting into flow, craft a perfect piece, then move on to the next task. in the new world, creating is becoming an almost infinite "X-axis activity". at once, you could be building two products through two claude instances, ideating and researching for a blog post, posting on your twitter channels and reading an article. you can produce at massive amounts now, as you never could before. i call this hypercreativity.
            </p>
            <p>
              the key to all this is good systems and orchestration. creators are becoming less doers and more systems managers. flow is being replaced by adept context switching. if you can run all of the above in different windows at the same time without losing output quality or sanity, you are a hypercreator, ready to compete in this new world built for beasts.
            </p>
            <p>
              the new skills needed are managerial. prioritization: what do you invest time in, what do you run parallelly, what do you kill. making judgement calls on what is good, what is good enough and when you need one over the other.
            </p>
            <p>
              the unfortunate effect is the exhaustion. flow gives joy; constant context switching drains. deep craft requires human agency, automation requires giving up agency and thereby the sense of self which makes craft personal and meaningful. i'm not trying to doomsday here. there must be some new skill, some behavioural pattern, some orchestration model to handle this effectively. as of this moment though, i'm still figuring it out.
            </p>
          </section>

          <section className="placeholder-section">
            <h2>one person studios</h2>
            <p>
              any massive human accomplishment across history happened as a web: companies, movements, organizations, studios. the web is still relevant, but the weights have changed. in the old world, any hyperproductive studio would be an elaborate web with multiple less-important, almost replaceable nodes being connected. today, the node is the center, and the webs are connections to ever-improving and almost replaceable external tools, resources and systems that augment the central node's workflow.
            </p>
            <p>
              i'm talking about the emergence of a one-person studio here. a single person can run a powerful company by automating a lot of tasks and building a lot of autonomous, parallel systems. a single person can be a founder, writer, singer all at the same time. multipotentialites are nothing new; but in the old world, these beasts were rarely found, in new world, these are expected to be the norm.
            </p>
            <p>
              this calls for us to stop looking at ourselves as one type of professionalist and start asking what areas we're passionate about creating in. it requires us to stop fighting for mastery and start building systems, trust and delegation. the biggest hurdle might be making sure that our output still retains our unique values, voice, and brand; that it still feels personal. perhaps we need to start thinking about building and hiring digital versions of ourselves: clones, not employees. introspecting and conversing with a soul.md or me.md might become important.
            </p>
          </section>

          <section className="placeholder-section">
            <h2>superhumans: fluidity</h2>
            <p>
              with all this discussion, one meta topic deserves attention. what kind of a human survives this new era? what does it mean to be a successful human? we've already touched upon some skills and traits at each level, but there's one higher-level trait i want to highlight here.
            </p>
            <p>
              the humans this era requires are fluid (reference: appa). they don't have stable skills and identities. when discussing new human capabilities, there's much to draw from agents. in some sense, the most powerful humans will be like claude.
            </p>
            <ol>
              <li>they won't hold on to one professional identity: they can be artists, researchers, builders, investors</li>
              <li>they are a collection of tools: tools to explore, build and evaluate. given a new domain, they can research the space and create context for themselves; they can teach themselves to build artifacts that are appropriate for the space; they can manage data to evaluate mastery and direction to grow. learning {'>'} knowledge.</li>
              <li>they do the above by building systems and parallel orchestration patterns</li>
              <li>the biggest fundamental skill will be understanding patterns, finding cross-domain insights, reasoning and making judgement calls. sensemaking {'>'} knowledge</li>
            </ol>
          </section>
        </div>
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
