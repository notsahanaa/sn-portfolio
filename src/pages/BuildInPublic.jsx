import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProjects, getProject } from '../api/client'
import TweetEmbed from '../components/TweetEmbed'
import LikeButton from '../components/LikeButton'
import '../styles/BuildInPublic.css'

const STATUS_LABELS = {
  'idea': 'idea',
  'in-progress': 'in progress',
  'paused': 'paused',
  'completed': 'completed',
  'abandoned': 'abandoned'
}

function BuildInPublic() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const formatDate = (dateStr) => {
    if (!dateStr) return 'present'
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
    const year = date.getFullYear()
    return `${month} ${year}`
  }

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects()
        setProjects(data)

        // If no slug provided and there are projects, redirect to first one
        if (!slug && data.length > 0) {
          navigate(`/projects/${data[0].slug}`, { replace: true })
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchProjects()
  }, [slug, navigate])

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

  if (loading && !currentProject) {
    return (
      <div className="build-in-public">
        <div className="projects-loading">loading...</div>
      </div>
    )
  }

  if (projects.length === 0 && !loading) {
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
      <nav className="breadcrumb">
        <Link to="/">home</Link> / <Link to="/projects">projects</Link>
        {currentProject && <> / {currentProject.name}</>}
      </nav>

      {error && <div className="projects-empty">{error}</div>}

      <div className="projects-layout">
        {/* Left sidebar */}
        <aside className="projects-sidebar">
          <div className="sidebar-header">
            <h1>things i build in public</h1>
            <p>i tinker and build for fun and share them on X. here's a collection of everything i've built in public.</p>
          </div>

          <ul className="project-list">
            {projects.map(project => (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.slug}`}
                  className={slug === project.slug ? 'active' : ''}
                >
                  {project.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right content area */}
        <main className="projects-content">
          {loading ? (
            <div className="projects-loading">loading...</div>
          ) : currentProject ? (
            <div className="project-detail">
              <header className="project-header">
                <h2>{currentProject.name}</h2>
                <p className="project-description">{currentProject.description}</p>
                <div className="project-meta">
                  <span className={`status-badge status-${currentProject.status}`}>
                    {STATUS_LABELS[currentProject.status] || currentProject.status}
                  </span>
                  <span className="meta-separator">|</span>
                  <span className="date-range">
                    {formatDate(currentProject.startDate)} - {formatDate(currentProject.endDate)}
                  </span>
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
                <div className="project-actions">
                  <LikeButton slug={slug} initialLikes={currentProject.likes} />
                </div>
              </header>

              <section className="posts-section">
                <h3>posts</h3>
                {currentProject.tweets && currentProject.tweets.length > 0 ? (
                  <div className="posts-timeline">
                    {currentProject.tweets.map(tweet => (
                      <TweetEmbed key={tweet.id} tweetUrl={tweet.tweetUrl} />
                    ))}
                  </div>
                ) : (
                  <div className="projects-empty">no posts yet.</div>
                )}
              </section>
            </div>
          ) : (
            <div className="projects-empty">project not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BuildInPublic
