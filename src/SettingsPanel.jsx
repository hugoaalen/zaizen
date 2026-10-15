import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import InterfaceIcon from './InterfaceIcon'

export default function SettingsPanel({ open, onClose, sections, footer }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id)
  const closeButtonRef = useRef(null)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    triggerRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus())

    const handleKeyDown = (event) => {
      if (document.querySelector('dialog[open]')) return
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const activeContent = sections.find(section => section.id === activeSection)?.content

  return createPortal(
    <div className="settings-overlay">
      <button type="button" className="settings-backdrop" onClick={onClose} aria-label="Cerrar ajustes" />
      <aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" aria-describedby="settings-description">
        <header className="settings-header">
          <div>
            <h2 id="settings-title">Ajustes</h2>
            <p id="settings-description">Tu espacio, a tu manera.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="settings-close" aria-label="Cerrar ajustes"><InterfaceIcon name="close" /></button>
        </header>

        <nav className="settings-tabs" role="tablist" aria-label="Secciones de ajustes">
          {sections.map(section => {
            const selected = activeSection === section.id
            return (
              <button
                key={section.id}
                id={`settings-tab-${section.id}`}
                type="button"
                role="tab"
                tabIndex={selected ? 0 : -1}
                aria-selected={selected}
                aria-controls={`settings-panel-${section.id}`}
                className={selected ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
                onKeyDown={event => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                  event.preventDefault()
                  const currentIndex = sections.findIndex(item => item.id === section.id)
                  const nextIndex = event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? sections.length - 1
                      : (currentIndex + (event.key === 'ArrowLeft' ? -1 : 1) + sections.length) % sections.length
                  setActiveSection(sections[nextIndex].id)
                  document.getElementById(`settings-tab-${sections[nextIndex].id}`)?.focus()
                }}
              >
                <span className="settings-tab-icon" aria-hidden="true">{section.icon}</span>
                {section.label}
              </button>
            )
          })}
        </nav>

        <div
          id={`settings-panel-${activeSection}`}
          className="settings-content"
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeSection}`}
          tabIndex={0}
        >
          {activeContent}
        </div>
        {footer && <footer className="settings-footer">{footer}</footer>}
      </aside>
    </div>,
    document.body
  )
}
