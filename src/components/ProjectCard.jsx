import { Link } from 'react-router-dom'
import LikeButton from './LikeButton'
import '../styles/ProjectCard.css'

const STATUS_LABELS = {
  'idea': 'idea',
  'in-progress': 'in progress',
  'paused': 'paused',
  'completed': 'completed',
  'abandoned': 'abandoned'
}

function ProjectCard({ project }) {
  const { slug, name, description, startDate, endDate, status, link, likes } = project

  const formatDate = (dateStr) => {
    if (!dateStr) return 'present'
    const date = new Date(dateStr)
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
    const year = date.getFullYear()
    return `${month} ${year}`
  }

  return (
    <article className="project-card">
      <Link to={`/projects/${slug}`} className="card-link">
        <h2 className="card-title">{name}</h2>
        <p className="card-description">{description}</p>
        <div className="card-meta">
          <span className={`status-badge status-${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
          <span className="date-range">
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
      </Link>
      <div className="card-footer">
        <LikeButton slug={slug} initialLikes={likes} />
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
            onClick={(e) => e.stopPropagation()}
          >
            visit →
          </a>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
