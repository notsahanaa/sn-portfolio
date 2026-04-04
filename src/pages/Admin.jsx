import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import AdminLogin from '../components/AdminLogin'
import '../styles/Admin.css'

function Admin() {
  const navigate = useNavigate()
  const { isLoggedIn, login, logout } = useAdmin()

  // Redirect to home if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleLogin = (token) => {
    login(token)
    navigate('/', { replace: true })
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-logged-in">
          <p>you are logged in as admin.</p>
          <p>use the edit button on public pages to make changes.</p>
          <button onClick={handleLogout} className="logout-btn">
            logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <AdminLogin onLogin={handleLogin} />
    </div>
  )
}

export default Admin
