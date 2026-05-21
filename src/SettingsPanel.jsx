export default function SettingsPanel({ open, onClose, children }) {
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
      />
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '480px',
        height: '100%',
        background: 'var(--bg-body)',
        animation: 'slideIn 0.3s ease',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Ajustes</h3>
          <button
            onClick={onClose}
            className="btn-outline"
            style={{ fontWeight: '700', fontSize: '14px' }}
          >
            ✕ Cerrar
          </button>
        </div>
        <div style={{
          flex: 1, overflow: 'auto',
          padding: '20px 24px 40px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
