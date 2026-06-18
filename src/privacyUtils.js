const CSV_COLUMNS = [
  ['date', 'Fecha'],
  ['description', 'Descripción'],
  ['type', 'Tipo'],
  ['category', 'Categoría'],
  ['amount', 'Importe']
]

const escapeCsvValue = value => {
  const rawText = String(value ?? '')
  const text = /^[=+\-@\t\r]/.test(rawText) ? `'${rawText}` : rawText
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const transactionsToCsv = transactions => {
  const header = CSV_COLUMNS.map(([, label]) => label).join(';')
  const rows = transactions.map(transaction =>
    CSV_COLUMNS.map(([key]) => {
      if (key === 'type') return transaction.type === 'income' ? 'Ingreso' : 'Gasto'
      if (key === 'amount') return Number(transaction.amount).toFixed(2).replace('.', ',')
      return transaction[key]
    }).map(escapeCsvValue).join(';')
  )

  return `\uFEFF${[header, ...rows].join('\r\n')}`
}

export const createBackupPayload = ({ user, data, exportedAt = new Date().toISOString() }) => ({
  format: 'zaizen-backup',
  version: 1,
  exported_at: exportedAt,
  profile: {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    metadata: user.user_metadata || {},
    providers: user.app_metadata?.providers || []
  },
  data
})

export const createExportFilename = (prefix, extension, date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10)
  return `${prefix}-${stamp}.${extension}`
}
