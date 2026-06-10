import { useEffect, useState } from 'react'

export default function SettingsPanel({ open, onClose, sections }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  const activeContent = sections.find(section => section.id === activeSection)?.content

  return (
    <div className="settings-overlay">
      <button className="settings-backdrop" onClick={onClose} aria-label="Cerrar ajustes" />
      <aside className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <span className="settings-eyebrow">Preferencias</span>
            <h2 id="settings-title">Ajustes</h2>
            <p>Personaliza cómo registras y visualizas tus finanzas.</p>
          </div>
          <button onClick={onClose} className="settings-close" aria-label="Cerrar ajustes">×</button>
        </header>

        <nav className="settings-tabs" aria-label="Secciones de ajustes">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeContent}
        </div>
      </aside>
    </div>
  )
}
