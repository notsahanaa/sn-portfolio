import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AdminProvider } from './context/AdminContext'
import ThemeToggle from './components/ThemeToggle'
import EditModeButton from './components/EditModeButton'
import Home from './pages/Home'
import BuildInPublic from './pages/BuildInPublic'
import Project from './pages/Project'
import Writes from './pages/Writes'
import Admin from './pages/Admin'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <ThemeToggle />
        <EditModeButton />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<BuildInPublic />} />
          <Route path="/projects/:slug" element={<BuildInPublic />} />
          <Route path="/writes" element={<Writes />} />
          <Route path="/writes/:slug" element={<Writes />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AdminProvider>
    </ThemeProvider>
  )
}

export default App
