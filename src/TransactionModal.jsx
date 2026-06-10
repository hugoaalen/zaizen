import { useEffect } from 'react'
import ExpenseForm from './ExpenseForm'

export default function TransactionModal({
  open,
  type,
  user,
  customCategories,
  onClose,
  onTransactionAdded
}) {
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" onMouseDown={event => event.stopPropagation()}>
        <header>
          <div>
            <span className="settings-eyebrow">Nuevo movimiento</span>
            <h2 id="transaction-modal-title">{type === 'income' ? 'Añadir ingreso' : 'Añadir gasto'}</h2>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Cerrar formulario">×</button>
        </header>
        <ExpenseForm
          key={type}
          user={user}
          customCategories={customCategories}
          initialType={type}
          onCancel={onClose}
          onTransactionAdded={() => {
            onTransactionAdded()
            onClose()
          }}
        />
      </div>
    </div>
  )
}
