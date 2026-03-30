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
        <Link to="/">Home</Link> / <span>Build in Public</span>
      </nav>

      <h1>Build in Public</h1>
      <p className="page-description">
        Follow along as I build projects in the open, sharing progress, learnings, and updates.
      </p>

      {loading && <p className="loading">Loading projects...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="empty">No projects yet. Check back soon!</p>
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
