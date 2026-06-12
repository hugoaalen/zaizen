import { useState } from 'react'
import { supabase } from './supabaseClient'
import {
  createBackupPayload,
  createExportFilename,
  transactionsToCsv
} from './privacyUtils'

const EXPORT_TABLES = [
  'transactions',
  'subscriptions',
  'custom_categories',
  'budgets',
  'categorization_rules',
  'savings_goals',
  'savings_contributions'
]

const triggerDownload = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const loadUserTable = async (table, userId) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export default function PrivacySettings({ user }) {
  const [loadingAction, setLoadingAction] = useState('')
  const [message, setMessage] = useState(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const exportTransactions = async () => {
    setLoadingAction('csv')
    setMessage(null)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error

      triggerDownload(
        transactionsToCsv(data || []),
        createExportFilename('zaizen-movimientos', 'csv'),
        'text/csv;charset=utf-8'
      )
      setMessage({ type: 'success', text: `${data?.length || 0} movimientos exportados.` })
    } catch (error) {
      setMessage({ type: 'error', text: `No se pudo crear el CSV: ${error.message}` })
    } finally {
      setLoadingAction('')
    }
  }

  const exportBackup = async () => {
    setLoadingAction('backup')
    setMessage(null)
    try {
      const tableEntries = await Promise.all(
        EXPORT_TABLES.map(async table => [table, await loadUserTable(table, user.id)])
      )
      const backup = createBackupPayload({
        user,
        data: Object.fromEntries(tableEntries)
      })

      triggerDownload(
        JSON.stringify(backup, null, 2),
        createExportFilename('zaizen-copia-completa', 'json'),
        'application/json;charset=utf-8'
      )
      setMessage({ type: 'success', text: 'Copia completa descargada correctamente.' })
    } catch (error) {
      setMessage({ type: 'error', text: `No se pudo crear la copia: ${error.message}` })
    } finally {
      setLoadingAction('')
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') return
    setLoadingAction('delete')
    setMessage(null)

    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setMessage({ type: 'error', text: `No se pudo eliminar la cuenta: ${error.message}` })
      setLoadingAction('')
      return
    }

    await supabase.auth.signOut()
  }

  return (
    <div className="settings-stack">
      <section className="settings-section privacy-section">
        <div className="settings-section-heading">
          <div>
            <h3>Exportación de datos</h3>
            <p>Descarga tus movimientos o conserva una copia completa de ZaiZen.</p>
          </div>
          <span className="privacy-lock" aria-hidden="true">⌁</span>
        </div>

        <div className="privacy-action-list">
          <article className="privacy-action">
            <div className="privacy-action-icon csv">CSV</div>
            <div>
              <strong>Movimientos en CSV</strong>
              <p>Compatible con Excel, Numbers y otras hojas de cálculo.</p>
            </div>
            <button className="btn-outline" type="button" onClick={exportTransactions} disabled={Boolean(loadingAction)}>
              {loadingAction === 'csv' ? 'Preparando...' : 'Descargar'}
            </button>
          </article>

          <article className="privacy-action">
            <div className="privacy-action-icon json">{'{ }'}</div>
            <div>
              <strong>Copia completa en JSON</strong>
              <p>Incluye perfil, movimientos, recurrentes, presupuestos, reglas y objetivos.</p>
            </div>
            <button className="btn-outline" type="button" onClick={exportBackup} disabled={Boolean(loadingAction)}>
              {loadingAction === 'backup' ? 'Preparando...' : 'Crear copia'}
            </button>
          </article>
        </div>

        <div className="privacy-note">
          <strong>Tu copia no incluye contraseñas ni tokens de acceso.</strong>
          <p>Los archivos se generan en tu navegador y se descargan directamente en tu dispositivo.</p>
        </div>
      </section>

      <section className="settings-section privacy-danger-zone">
        <div className="settings-section-heading">
          <div>
            <span className="settings-eyebrow">Zona de peligro</span>
            <h3>Eliminar cuenta</h3>
            <p>Borra definitivamente tu usuario y todos los datos financieros asociados.</p>
          </div>
        </div>

        {!showDeleteConfirmation ? (
          <div className="privacy-delete-summary">
            <div>
              <strong>Esta acción no se puede deshacer</strong>
              <p>Antes de continuar, te recomendamos descargar una copia completa.</p>
            </div>
            <button className="privacy-delete-button" type="button" onClick={() => setShowDeleteConfirmation(true)}>
              Eliminar mi cuenta
            </button>
          </div>
        ) : (
          <div className="privacy-delete-confirmation">
            <p>Escribe <strong>ELIMINAR</strong> para confirmar que quieres borrar tu cuenta y todos sus datos.</p>
            <input
              className="input-minimal"
              value={deleteConfirmation}
              onChange={event => setDeleteConfirmation(event.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
            />
            <div>
              <button
                className="btn-outline"
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeleteConfirmation('')
                }}
              >
                Cancelar
              </button>
              <button
                className="privacy-delete-button"
                type="button"
                disabled={deleteConfirmation !== 'ELIMINAR' || loadingAction === 'delete'}
                onClick={deleteAccount}
              >
                {loadingAction === 'delete' ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        )}
      </section>

      {message && <p className={`privacy-message ${message.type}`} role="status">{message.text}</p>}
    </div>
  )
}
