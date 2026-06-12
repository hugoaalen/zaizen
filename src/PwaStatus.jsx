import { useEffect, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'

export default function PwaStatus() {
  const online = useOnlineStatus()
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handleInstallPrompt = event => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => setInstallPrompt(null)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  if (online && !installPrompt) return null

  return (
    <aside className={`pwa-status ${online ? 'installable' : 'offline'}`} aria-live="polite">
      <span className="pwa-status-dot" />
      <div>
        <strong>{online ? 'Instala ZaiZen' : 'Sin conexión'}</strong>
        <small>{online ? 'Úsala como una app en este dispositivo.' : 'Mostrando los últimos datos guardados. Solo consulta.'}</small>
      </div>
      {online && installPrompt && (
        <button type="button" onClick={installApp}>Instalar</button>
      )}
    </aside>
  )
}
