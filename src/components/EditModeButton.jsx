import { useAdmin } from '../context/AdminContext'
import { useLocation } from 'react-router-dom'
import '../styles/EditMode.css'

function EditModeButton() {
  const { isLoggedIn, isEditMode, toggleEditMode } = useAdmin()
  const location = useLocation()

  // Only show on pages that support editing (writes and projects)
  const editablePages = ['/writes', '/projects']
  const isEditablePage = editablePages.some(page => location.pathname.startsWith(page))

  if (!isLoggedIn || !isEditablePage) {
    return null
  }

  return (
    <button
      className={`edit-mode-button ${isEditMode ? 'active' : ''}`}
      onClick={toggleEditMode}
      aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
      title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
    >
      {isEditMode ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      )}
    </button>
  )
}

export default EditModeButton
