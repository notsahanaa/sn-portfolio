import { Link } from 'react-router-dom'
import '../styles/Home.css'

function Home() {
  return (
    <div className="home-container">
      <div className="home-intro">
        <h1>i'm sahanaa :)</h1>
        <p>
          i <Link to="/projects" className="inline-link">build AI products in public</Link> + <Link to="/writes" className="inline-link">write about agentic AI</Link>
        </p>
      </div>
    </div>
  )
}

export default Home
