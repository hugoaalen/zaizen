import { CATEGORY_MAP } from './constants.js'

const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()

export const normalizeRuleText = value => normalize(value)
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export const suggestRulePattern = description => {
  const clean = normalizeRuleText(String(description || '').split('\\')[0])
    .replace(/\b\d{5,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.split(' ').filter(Boolean).slice(0, 2).join(' ')
}

export const applyCategorizationRules = (rows, rules = []) => {
  const orderedRules = [...rules].sort((a, b) => b.pattern.length - a.pattern.length)
  return rows.map(row => {
    const description = normalizeRuleText(row.description)
    const rule = orderedRules.find(item =>
      item.transaction_type === row.type &&
      description.includes(normalizeRuleText(item.pattern))
    )
    return rule
      ? { ...row, category: rule.category, appliedRule: rule.pattern }
      : row
  })
}

const COLUMN_ALIASES = {
  date: ['fecha', 'fecha operacion', 'fecha valor', 'date', 'booking date', 'transaction date'],
  description: ['concepto', 'descripcion', 'detalle', 'movimiento', 'comercio', 'description', 'details', 'merchant', 'memo'],
  amount: ['importe', 'cantidad', 'monto', 'amount', 'importe eur', 'importe (€)'],
  debit: ['cargo', 'debe', 'debito', 'debit', 'withdrawal', 'salida'],
  credit: ['abono', 'haber', 'credito', 'credit', 'deposit', 'entrada'],
  category: ['categoria', 'category', 'tipo movimiento']
}

const detectDelimiter = (line) => {
  const candidates = [';', ',', '\t']
  return candidates.reduce((best, delimiter) => {
    const count = line.split(delimiter).length - 1
    return count > best.count ? { delimiter, count } : best
  }, { delimiter: ';', count: -1 }).delimiter
}

const parseDelimited = (text, delimiter) => {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]

    if (character === '"' && quoted && next === '"') {
      field += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === delimiter && !quoted) {
      row.push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1
      row.push(field.trim())
      if (row.some(value => value !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  row.push(field.trim())
  if (row.some(value => value !== '')) rows.push(row)
  return rows
}

export const parseCsv = (text) => {
  const cleanText = String(text || '').replace(/^\uFEFF/, '')
  const firstLine = cleanText.split(/\r?\n/, 1)[0] || ''
  const delimiter = detectDelimiter(firstLine)
  const matrix = parseDelimited(cleanText, delimiter)
  if (matrix.length < 2) return { headers: matrix[0] || [], rows: [], delimiter }

  const headers = matrix[0].map((header, index) => header || `Columna ${index + 1}`)
  const rows = matrix.slice(1).map(values =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  )

  return { headers, rows, delimiter }
}

export const detectColumnMapping = (headers) => {
  const mapping = {}

  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    const exact = headers.find(header => aliases.includes(normalize(header)))
    const partial = headers.find(header =>
      aliases.some(alias => normalize(header).includes(alias) || alias.includes(normalize(header)))
    )
    mapping[field] = exact || partial || ''
  })

  return mapping
}

export const parseBankAmount = (value) => {
  if (value == null || value === '') return null

  let normalized = String(value)
    .replace(/\s/g, '')
    .replace(/[€$£]/g, '')
    .replace(/[−–—]/g, '-')

  const negativeByParentheses = normalized.startsWith('(') && normalized.endsWith(')')
  normalized = normalized.replace(/[()]/g, '')

  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')
  if (lastComma > lastDot) normalized = normalized.replace(/\./g, '').replace(',', '.')
  else if (lastDot > lastComma && lastComma >= 0) normalized = normalized.replace(/,/g, '')
  else if (lastComma >= 0) normalized = normalized.replace(',', '.')

  const amount = Number(normalized)
  if (!Number.isFinite(amount)) return null
  return negativeByParentheses ? -Math.abs(amount) : amount
}

export const parseBankDate = (value) => {
  const clean = String(value || '').trim().split(/[ T]/)[0]
  if (!clean) return null

  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  const localMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  let year
  let month
  let day

  if (isoMatch) {
    year = Number(isoMatch[1])
    month = Number(isoMatch[2])
    day = Number(isoMatch[3])
  } else if (localMatch) {
    day = Number(localMatch[1])
    month = Number(localMatch[2])
    year = Number(localMatch[3])
    if (year < 100) year += 2000
  } else {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const categorizeBankDescription = (description, type = 'expense') => {
  const normalized = normalize(description)
  if (type === 'income') {
    return ['nomina', 'salary', 'payroll'].some(keyword => normalized.includes(keyword))
      ? 'Nómina'
      : 'Varios'
  }

  const match = Object.entries(CATEGORY_MAP).find(([, keywords]) =>
    keywords.some(keyword => normalized.includes(normalize(keyword)))
  )
  return match ? match[0].charAt(0).toUpperCase() + match[0].slice(1) : 'Varios'
}

export const createTransactionFingerprint = ({ date, amount, description, type }) =>
  `${date}|${type || ''}|${Number(amount).toFixed(2)}|${normalize(description).replace(/\s+/g, ' ')}`

export const mapCsvRows = (rows, mapping, options = {}) => {
  const { expenseSign = 'negative', defaultCategory = 'Varios' } = options

  return rows.map((row, index) => {
    const date = parseBankDate(row[mapping.date])
    const description = String(row[mapping.description] || '').trim()
    const debit = mapping.debit ? parseBankAmount(row[mapping.debit]) : null
    const credit = mapping.credit ? parseBankAmount(row[mapping.credit]) : null
    const rawAmount = mapping.amount ? parseBankAmount(row[mapping.amount]) : null

    let type
    let amount
    if (credit != null && credit !== 0) {
      type = 'income'
      amount = Math.abs(credit)
    } else if (debit != null && debit !== 0) {
      type = 'expense'
      amount = Math.abs(debit)
    } else if (rawAmount != null && rawAmount !== 0) {
      const isExpense = expenseSign === 'negative' ? rawAmount < 0 : rawAmount > 0
      type = isExpense ? 'expense' : 'income'
      amount = Math.abs(rawAmount)
    }

    const importedCategory = String(row[mapping.category] || '').trim()
    const category = importedCategory || categorizeBankDescription(description, type) || defaultCategory
    const errors = []
    if (!date) errors.push('Fecha no válida')
    if (!description) errors.push('Sin descripción')
    if (!amount || !type) errors.push('Importe no válido')

    return {
      sourceIndex: index,
      date,
      description,
      amount,
      type,
      category,
      errors,
      warnings: [],
      selected: errors.length === 0
    }
  })
}

export const flagDateOutliers = (rows) => {
  const validYears = rows
    .filter(row => row.date && row.errors.length === 0)
    .map(row => row.date.slice(0, 4))

  if (validYears.length < 10) return rows

  const counts = validYears.reduce((result, year) => {
    result[year] = (result[year] || 0) + 1
    return result
  }, {})
  const [dominantYear, dominantCount] = Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)[0]

  if (dominantCount / validYears.length < 0.8) return rows

  return rows.map(row => {
    if (!row.date || row.date.startsWith(dominantYear)) return row
    return {
      ...row,
      warnings: [`Año atípico: el extracto parece ser de ${dominantYear}`],
      selected: false
    }
  })
}
