import { useState } from 'react'
import { login } from '../api/client'
import '../styles/AdminLogin.css'

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token } = await login(password)
      onLogin(token)
    } catch (err) {
      setError(err.message || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            disabled={loading}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

export default AdminLogin
