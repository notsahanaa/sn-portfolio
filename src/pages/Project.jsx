import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject } from '../api/client'
import LikeButton from '../components/LikeButton'
import TweetEmbed from '../components/TweetEmbed'
import '../styles/Project.css'

const STATUS_LABELS = {
  'idea': 'Idea',
  'in-progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed',
  'abandoned': 'Abandoned'
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
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="project-page">
        <p className="loading">Loading project...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-page">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/projects">Projects</Link> / <span>Not Found</span>
        </nav>
        <p className="error">Project not found</p>
        <Link to="/projects" className="back-link">← Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="project-page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/projects">Projects</Link> / <span>{project.name}</span>
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
              Visit Project →
            </a>
          )}
        </div>
      </header>

      <section className="tweets-section">
        <h2>Updates</h2>
        {project.tweets.length === 0 ? (
          <p className="no-tweets">No updates yet. Check back soon!</p>
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
