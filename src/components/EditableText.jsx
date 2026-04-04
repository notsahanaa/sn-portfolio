import { useState, useEffect, useRef } from 'react'
import { useAdmin } from '../context/AdminContext'
import '../styles/EditMode.css'

function EditableText({
  value,
  onChange,
  as: Element = 'p',
  placeholder = 'Click to edit...',
  multiline = false,
  className = ''
}) {
  const { isEditMode } = useAdmin()
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setLocalValue(value)
      e.target.blur()
    }
  }

  if (!isEditMode) {
    return <Element className={className}>{value || placeholder}</Element>
  }

  const inputClassName = `editable-text-input ${className}`

  if (multiline) {
    return (
      <textarea
        ref={inputRef}
        className={inputClassName}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
      />
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      className={inputClassName}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  )
}

export default EditableText
