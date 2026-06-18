const CACHE_PREFIX = 'zaizen:offline:v1'
const ALL_CACHE_PREFIXES = ['zaizen:offline:']

const getStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const createOfflineCacheKey = (userId, resource, period = 'all') =>
  `${CACHE_PREFIX}:${userId}:${resource}:${period}`

export const saveOfflineData = (userId, resource, period, data) => {
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.setItem(
      createOfflineCacheKey(userId, resource, period),
      JSON.stringify({ savedAt: new Date().toISOString(), data })
    )
    return true
  } catch {
    return false
  }
}

export const loadOfflineData = (userId, resource, period) => {
  const storage = getStorage()
  if (!storage) return null

  try {
    const cached = storage.getItem(createOfflineCacheKey(userId, resource, period))
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

const removeMatchingKeys = predicate => {
  const storage = getStorage()
  if (!storage) return false

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    keys.filter(key => key && predicate(key)).forEach(key => storage.removeItem(key))
    return true
  } catch {
    return false
  }
}

export const clearOfflineData = userId =>
  removeMatchingKeys(key => ALL_CACHE_PREFIXES.some(prefix =>
    key.startsWith(prefix) && key.split(':')[3] === String(userId)
  ))

export const clearAllOfflineData = () =>
  removeMatchingKeys(key => ALL_CACHE_PREFIXES.some(prefix => key.startsWith(prefix)))

export const getMonthlyCachePeriod = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`
