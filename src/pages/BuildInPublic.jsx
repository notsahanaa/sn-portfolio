import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../api/client'
import ProjectCard from '../components/ProjectCard'
import '../styles/BuildInPublic.css'

function BuildInPublic() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects()
        setProjects(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div className="build-in-public">
      <nav className="breadcrumb">
        <Link to="/">home</Link> / <span>build in public</span>
      </nav>

      <h1>build in public</h1>
      <p className="page-description">
        follow along as i build projects in the open, sharing progress, learnings, and updates.
      </p>

      {loading && <p className="loading">loading projects...</p>}

      {error && <p className="error">error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="empty">no projects yet. check back soon!</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BuildInPublic
