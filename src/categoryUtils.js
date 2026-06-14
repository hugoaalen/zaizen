export const cleanCategoryName = value =>
  String(value || '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')

export const normalizeCategoryKey = value =>
  cleanCategoryName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

export const mergeCategoryNames = (...categoryLists) => {
  const categories = new Map()

  categoryLists.flat().forEach(value => {
    const name = cleanCategoryName(value)
    const key = normalizeCategoryKey(name)
    if (key && !categories.has(key)) categories.set(key, name)
  })

  return [...categories.values()]
}

export const getPreferredCategoryName = (value, preferredCategories = []) => {
  const key = normalizeCategoryKey(value || 'Varios')
  return preferredCategories.find(category => normalizeCategoryKey(category) === key)
    || cleanCategoryName(value)
    || 'Varios'
}

export const groupTransactionsByCategory = (transactions, type, preferredCategories = []) => {
  const groups = new Map()

  transactions
    .filter(transaction => transaction.type === type)
    .forEach(transaction => {
      const name = getPreferredCategoryName(transaction.category, preferredCategories)
      const key = normalizeCategoryKey(name)
      const current = groups.get(key)
      const value = Number(transaction.amount)

      if (current) current.value += value
      else groups.set(key, { name, value })
    })

  return [...groups.values()].sort((a, b) => b.value - a.value)
}
