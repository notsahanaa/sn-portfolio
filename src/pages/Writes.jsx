import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTopics, getTopic } from '../api/client'
import DOMPurify from 'isomorphic-dompurify'
import '../styles/Writes.css'

function Writes() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [currentTopic, setCurrentTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch all topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getTopics()
        setTopics(data)

        // If no slug provided and there are topics, redirect to first one
        if (!slug && data.length > 0) {
          navigate(`/writes/${data[0].slug}`, { replace: true })
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchTopics()
  }, [slug, navigate])

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
      } catch (err) {
        setError(err.message)
        setCurrentTopic(null)
      } finally {
        setLoading(false)
      }
    }
    fetchTopic()
  }, [slug])

  if (loading && !currentTopic) {
    return (
      <div className="writes-page">
        <div className="writes-loading">loading...</div>
      </div>
    )
  }

  if (topics.length === 0 && !loading) {
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
      <nav className="writes-breadcrumb">
        <Link to="/">home</Link> / <Link to="/writes">writes</Link>
        {currentTopic && <> / {currentTopic.name}</>}
      </nav>

      {error && <div className="writes-empty">{error}</div>}

      <div className="writes-layout">
        {/* Left sidebar */}
        <aside className="writes-sidebar">
          {currentTopic && (
            <div className="current-topic">
              <h1>{currentTopic.name}</h1>
              {currentTopic.description && (
                <p>{currentTopic.description}</p>
              )}
            </div>
          )}

          <ul className="topic-list">
            {topics.map(topic => (
              <li key={topic.id}>
                <Link
                  to={`/writes/${topic.slug}`}
                  className={slug === topic.slug ? 'active' : ''}
                >
                  {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right content area */}
        <main className="writes-content">
          {loading ? (
            <div className="writes-loading">loading...</div>
          ) : currentTopic ? (
            <div className="sections-list">
              {currentTopic.sections && currentTopic.sections.length > 0 ? (
                currentTopic.sections.map(section => (
                  <article key={section.id} className="section-item">
                    <h2>{section.title}</h2>
                    <div
                      className="section-content"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(section.content)
                      }}
                    />
                  </article>
                ))
              ) : (
                <div className="writes-empty">no sections yet.</div>
              )}
            </div>
          ) : (
            <div className="writes-empty">topic not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Writes
