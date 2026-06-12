const CACHE_PREFIX = 'zaizen:offline:v1'

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

export const getMonthlyCachePeriod = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`
