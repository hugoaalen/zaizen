import { useState } from 'react'

export default function CollapsibleSection({
  title,
  description,
  children,
  storageKey,
  defaultOpen = true,
  className = ''
}) {
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? defaultOpen : saved === 'true'
  })

  const toggle = () => {
    setOpen(current => {
      localStorage.setItem(storageKey, String(!current))
      return !current
    })
  }

  return (
    <section className={`dashboard-section ${className}`}>
      <button className="dashboard-section-header" onClick={toggle} aria-expanded={open}>
        <span>
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        <i>{open ? '−' : '+'}</i>
      </button>
      {open && <div className="dashboard-section-content">{children}</div>}
    </section>
  )
}
