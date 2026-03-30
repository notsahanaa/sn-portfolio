import { Link } from 'react-router-dom'
import '../styles/Home.css'

function Home() {
  const text = "Coming Soon :)"

  return (
    <div className="home-container">
      <h1 className="wave-text">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
      <nav className="home-nav">
        <Link to="/projects">Build in Public</Link>
      </nav>
    </div>
  )
}

export default Home
