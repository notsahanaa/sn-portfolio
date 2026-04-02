import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject } from '../api/client'
import LikeButton from '../components/LikeButton'
import TweetEmbed from '../components/TweetEmbed'
import '../styles/Project.css'

const STATUS_LABELS = {
  'idea': 'idea',
  'in-progress': 'in progress',
  'paused': 'paused',
  'completed': 'completed',
  'abandoned': 'abandoned'
}

function Project() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const data = await getProject(slug)
        setProject(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [slug])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'present'
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  if (loading) {
    return (
      <div className="project-page">
        <p className="loading">loading project...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-page">
        <nav className="breadcrumb">
          <Link to="/">home</Link> / <Link to="/projects">projects</Link> / <span>not found</span>
        </nav>
        <p className="error">project not found</p>
        <Link to="/projects" className="back-link">← back to projects</Link>
      </div>
    )
  }

  return (
    <div className="project-page">
      <nav className="breadcrumb">
        <Link to="/">home</Link> / <Link to="/projects">projects</Link> / <span>{project.name}</span>
      </nav>

      <header className="project-header">
        <h1>{project.name}</h1>
        <p className="project-description">{project.description}</p>

        <div className="project-meta">
          <span className={`status-badge status-${project.status}`}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
          <span className="date-range">
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </span>
        </div>

        <div className="project-actions">
          <LikeButton slug={slug} initialLikes={project.likes} />
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="visit-link"
            >
              visit project →
            </a>
          )}
        </div>
      </header>

      <section className="tweets-section">
        <h2>updates</h2>
        {project.tweets.length === 0 ? (
          <p className="no-tweets">no updates yet. check back soon!</p>
        ) : (
          <div className="tweets-timeline">
            {project.tweets.map(tweet => (
              <TweetEmbed key={tweet.id} tweetUrl={tweet.tweetUrl} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Project
