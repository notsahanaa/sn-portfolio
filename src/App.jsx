import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BuildInPublic from './pages/BuildInPublic'
import Project from './pages/Project'
import Admin from './pages/Admin'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<BuildInPublic />} />
      <Route path="/projects/:slug" element={<Project />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default App
