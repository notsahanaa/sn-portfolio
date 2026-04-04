/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [adminToken, setAdminToken] = useState(null)

  // Check localStorage for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setAdminToken(token)
      setIsLoggedIn(true)
    }
  }, [])

  const login = useCallback((token) => {
    localStorage.setItem('adminToken', token)
    setAdminToken(token)
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAdminToken(null)
    setIsLoggedIn(false)
    setIsEditMode(false)
  }, [])

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
  }, [])

  return (
    <AdminContext.Provider value={{
      isLoggedIn,
      isEditMode,
      adminToken,
      login,
      logout,
      toggleEditMode
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
