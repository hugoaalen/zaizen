import { useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import {
  createTransactionFingerprint,
  detectColumnMapping,
  flagDateOutliers,
  mapCsvRows,
  parseCsv
} from './csvImportUtils'

const readBankFile = async (file) => {
  const bytes = await file.arrayBuffer()
  let text = new TextDecoder('utf-8').decode(bytes)
  if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(bytes)
  return text
}

export default function BankCsvImporter({ user, customCategories, onImported }) {
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [sourceRows, setSourceRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [expenseSign, setExpenseSign] = useState('negative')
  const [previewRows, setPreviewRows] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const categoriesByType = useMemo(() => ({
    expense: [...new Set([
      ...BASE_EXPENSE_CATEGORIES,
      ...(customCategories || []).filter(category => category.type === 'expense').map(category => category.name)
    ])],
    income: [...new Set([
      ...BASE_INCOME_CATEGORIES,
      ...(customCategories || []).filter(category => category.type === 'income').map(category => category.name)
    ])]
  }), [customCategories])

  const hasRequiredMapping = mapping.date && mapping.description &&
    (mapping.amount || mapping.debit || mapping.credit)
  const validRows = previewRows.filter(row => row.errors.length === 0)
  const selectedRows = validRows.filter(row => row.selected)
  const duplicateCount = previewRows.filter(row => row.duplicate).length

  const reset = () => {
    setFileName('')
    setHeaders([])
    setSourceRows([])
    setMapping({})
    setPreviewRows([])
    setStatus('')
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus('')
    const parsed = parseCsv(await readBankFile(file))
    if (!parsed.headers.length || !parsed.rows.length) {
      setStatus('No se encontraron movimientos en el archivo.')
      return
    }

    setFileName(file.name)
    setHeaders(parsed.headers)
    setSourceRows(parsed.rows)
    setMapping(detectColumnMapping(parsed.headers))
    setPreviewRows([])
  }

  const buildPreview = async () => {
    setLoading(true)
    setStatus('')
    const mappedRows = flagDateOutliers(mapCsvRows(sourceRows, mapping, { expenseSign }))
    const datedRows = mappedRows.filter(row => row.date)
    const dates = datedRows.map(row => row.date).sort()
    let existingFingerprints = new Set()

    if (dates.length) {
      const { data, error } = await supabase
        .from('transactions')
        .select('date,amount,description,type')
        .eq('user_id', user.id)
        .gte('date', dates[0])
        .lte('date', dates[dates.length - 1])

      if (error) {
        setStatus('No se pudieron comprobar los movimientos duplicados.')
        setLoading(false)
        return
      }
      existingFingerprints = new Set(data.map(createTransactionFingerprint))
    }

    const seenInFile = new Set()
    setPreviewRows(mappedRows.map(row => {
      if (row.errors.length) return row
      const fingerprint = createTransactionFingerprint(row)
      const duplicate = existingFingerprints.has(fingerprint) || seenInFile.has(fingerprint)
      seenInFile.add(fingerprint)
      return { ...row, duplicate, selected: !duplicate }
    }))
    setLoading(false)
  }

  const updateRow = (sourceIndex, changes) => {
    setPreviewRows(rows => rows.map(row =>
      row.sourceIndex === sourceIndex ? { ...row, ...changes } : row
    ))
  }

  const updateRowDate = (row, date) => {
    updateRow(row.sourceIndex, {
      date,
      warnings: [],
      selected: Boolean(date) && row.errors.filter(error => error !== 'Fecha no válida').length === 0,
      errors: date
        ? row.errors.filter(error => error !== 'Fecha no válida')
        : [...new Set([...row.errors, 'Fecha no válida'])]
    })
  }

  const importSelected = async () => {
    if (!selectedRows.length) return
    setLoading(true)
    setStatus('')

    const payload = selectedRows.map(row => ({
      user_id: user.id,
      date: row.date,
      description: row.description,
      amount: row.amount,
      type: row.type,
      category: row.category || 'Varios'
    }))
    const { error } = await supabase.from('transactions').insert(payload)

    if (error) {
      setStatus('No se pudieron importar los movimientos.')
    } else {
      const importedCount = payload.length
      reset()
      setStatus(`${importedCount} movimientos importados correctamente.`)
      onImported?.()
    }
    setLoading(false)
  }

  return (
    <section className="settings-section bank-importer">
      <div className="settings-section-heading">
        <div>
          <h3>Importar extracto bancario</h3>
          <p>Admite CSV con importe único o columnas separadas de cargo y abono.</p>
        </div>
        {fileName && <button type="button" className="btn-outline import-reset" onClick={reset}>Reiniciar</button>}
      </div>

      {!headers.length ? (
        <label className="bank-file-drop">
          <input type="file" accept=".csv,text/csv,.txt" onChange={handleFile} />
          <span>CSV</span>
          <strong>Selecciona el archivo de tu banco</strong>
          <small>Los datos se revisan antes de guardarse.</small>
        </label>
      ) : (
        <>
          <div className="import-file-summary">
            <div><span>Archivo</span><strong>{fileName}</strong></div>
            <div><span>Filas detectadas</span><strong>{sourceRows.length}</strong></div>
            <div><span>Columnas</span><strong>{headers.length}</strong></div>
          </div>

          <div className="import-mapping">
            <div className="settings-section-heading">
              <div>
                <h3>Relaciona las columnas</h3>
                <p>Hemos intentado detectarlas automáticamente.</p>
              </div>
            </div>
            <div className="import-mapping-grid">
              {[
                ['date', 'Fecha'],
                ['description', 'Descripción'],
                ['amount', 'Importe único'],
                ['debit', 'Cargo / débito'],
                ['credit', 'Abono / crédito'],
                ['category', 'Categoría (opcional)']
              ].map(([field, label]) => (
                <label key={field}>
                  {label}
                  <select
                    className="input-minimal"
                    value={mapping[field] || ''}
                    onChange={event => setMapping(current => ({ ...current, [field]: event.target.value }))}
                  >
                    <option value="">No usar</option>
                    {headers.map(header => <option key={header} value={header}>{header}</option>)}
                  </select>
                </label>
              ))}
              {mapping.amount && (
                <label>
                  Cómo interpreta el banco los gastos
                  <select className="input-minimal" value={expenseSign} onChange={event => setExpenseSign(event.target.value)}>
                    <option value="negative">Los gastos son negativos</option>
                    <option value="positive">Los gastos son positivos</option>
                  </select>
                </label>
              )}
            </div>
            <button type="button" className="btn-minimal import-preview-button" disabled={!hasRequiredMapping || loading} onClick={buildPreview}>
              {loading ? 'Analizando...' : 'Generar previsualización'}
            </button>
          </div>
        </>
      )}

      {previewRows.length > 0 && (
        <div className="import-preview">
          <div className="settings-section-heading">
            <div>
              <h3>Movimientos preparados</h3>
              <p>{selectedRows.length} seleccionados · {duplicateCount} posibles duplicados</p>
            </div>
            <button type="button" className="btn-minimal" disabled={!selectedRows.length || loading} onClick={importSelected}>
              {loading ? 'Importando...' : `Importar ${selectedRows.length}`}
            </button>
          </div>

          <div className="import-preview-list">
            {previewRows.map(row => (
              <article className={`import-preview-row ${row.errors.length ? 'invalid' : ''}`} key={row.sourceIndex}>
                <input
                  type="checkbox"
                  checked={row.selected}
                  disabled={row.errors.length > 0}
                  onChange={event => updateRow(row.sourceIndex, { selected: event.target.checked })}
                  aria-label={`Importar ${row.description || `fila ${row.sourceIndex + 1}`}`}
                />
                <div className="import-preview-copy">
                  <strong>{row.description || `Fila ${row.sourceIndex + 1}`}</strong>
                  <input
                    className="input-minimal import-date"
                    type="date"
                    value={row.date || ''}
                    onChange={event => updateRowDate(row, event.target.value)}
                    aria-label={`Fecha de ${row.description || `fila ${row.sourceIndex + 1}`}`}
                  />
                  <small>
                    {row.errors.join(', ') ||
                      row.warnings?.join(', ') ||
                      (row.duplicate ? 'Posible duplicado' : 'Nuevo movimiento')}
                  </small>
                </div>
                {!row.errors.length && (
                  <>
                    <select
                      className="input-minimal import-type"
                      value={row.type}
                      onChange={event => updateRow(row.sourceIndex, {
                        type: event.target.value,
                        category: 'Varios'
                      })}
                    >
                      <option value="expense">Gasto</option>
                      <option value="income">Ingreso</option>
                    </select>
                    <select
                      className="input-minimal import-category"
                      value={row.category}
                      onChange={event => updateRow(row.sourceIndex, { category: event.target.value })}
                    >
                      {[...new Set([row.category, ...categoriesByType[row.type]])].map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <strong className={row.type === 'income' ? 'amount-income' : 'amount-expense'}>
                      {row.type === 'income' ? '+' : '-'}{Number(row.amount).toFixed(2)} €
                    </strong>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {status && <p className={status.includes('correctamente') ? 'import-status success' : 'form-error import-status'} role="status">{status}</p>}
    </section>
  )
}
