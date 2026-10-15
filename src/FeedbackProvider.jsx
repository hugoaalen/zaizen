import { createContext, useContext, useEffect, useRef, useState } from 'react'

const FeedbackContext = createContext(null)

// Confirmation uses the native top layer, including keyboard and background isolation.
export function FeedbackProvider({ children }) {
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState('')
  const dialog = useRef(null)
  const cancel = useRef(null)
  const resolver = useRef(null)
  const trigger = useRef(null)

  const finish = value => {
    dialog.current?.close()
    resolver.current?.(value)
    resolver.current = null
    setPending(null)
    trigger.current?.focus?.()
  }

  useEffect(() => {
    if (pending) {
      dialog.current.showModal()
      cancel.current.focus()
    }
  }, [pending])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 6000)
    return () => clearTimeout(timer)
  }, [message])

  const confirm = description => new Promise(resolve => {
    if (resolver.current) { resolve(false); return }
    trigger.current = document.activeElement
    resolver.current = resolve
    setPending(description)
  })

  return (
    <FeedbackContext.Provider value={{ confirm, notify: setMessage }}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className={message ? 'operation-feedback visible' : 'operation-feedback'}>{message}</div>
      <dialog ref={dialog} className="confirmation-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onCancel={event => { event.preventDefault(); finish(false) }}>
        <h2 id="confirmation-title">Confirmar eliminación</h2>
        <p id="confirmation-description">{pending}</p>
        <div className="modal-actions">
          <button ref={cancel} className="btn-outline" onClick={() => finish(false)}>Cancelar</button>
          <button className="privacy-delete-button" onClick={() => finish(true)}>Eliminar</button>
        </div>
      </dialog>
    </FeedbackContext.Provider>
  )
}

// Kept together so all destructive actions share the same interaction.
// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = () => useContext(FeedbackContext)
