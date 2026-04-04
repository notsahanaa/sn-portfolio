import '../styles/EditMode.css'

function InlineForm({ isOpen, onSubmit, onCancel, children, submitLabel = 'Save' }) {
  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="inline-form">
      <form onSubmit={handleSubmit}>
        <div className="inline-form-fields">
          {children}
        </div>
        <div className="inline-form-actions">
          <button type="submit" className="inline-form-submit">
            {submitLabel}
          </button>
          <button type="button" className="inline-form-cancel" onClick={onCancel}>
            cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default InlineForm
