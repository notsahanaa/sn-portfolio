import { Link } from 'react-router-dom'
import LikeButton from './LikeButton'
import '../styles/ProjectCard.css'

const STATUS_LABELS = {
  'idea': 'Idea',
  'in-progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed',
  'abandoned': 'Abandoned'
}

function ProjectCard({ project }) {
  const { slug, name, description, startDate, endDate, status, link, likes } = project

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
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
            Visit →
          </a>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
