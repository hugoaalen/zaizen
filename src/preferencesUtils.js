export const PREFERENCE_OPTIONS = {
  theme: ['light', 'dark'],
  monthlyChart: ['circular', 'barras', 'mosaico'],
  yearlyChart: ['barras', 'lineas', 'area'],
  chartPalette: ['normal', 'pastel', 'vibrante'],
  accentColor: ['purple', 'blue', 'green', 'rose', 'orange'],
  density: ['compact', 'normal', 'comfortable'],
  initialView: ['monthly', 'yearly']
}

const STORAGE_KEYS = {
  theme: 'theme',
  monthlyChart: 'chartTypeMonthly',
  yearlyChart: 'chartTypeYearly',
  chartPalette: 'chartPalette',
  accentColor: 'accentColor',
  density: 'density',
  initialView: 'initialView'
}

const getStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const getSystemTheme = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'dark'
  }
}

export const getDefaultPreferences = () => ({
  theme: getSystemTheme(),
  monthlyChart: 'circular',
  yearlyChart: 'barras',
  chartPalette: 'normal',
  accentColor: 'purple',
  density: 'normal',
  initialView: 'monthly'
})

export const sanitizePreferences = preferences => {
  const defaults = getDefaultPreferences()

  return Object.fromEntries(
    Object.entries(PREFERENCE_OPTIONS).map(([key, options]) => [
      key,
      options.includes(preferences?.[key]) ? preferences[key] : defaults[key]
    ])
  )
}

export const loadLocalPreferences = () => {
  const storage = getStorage()
  if (!storage) return getDefaultPreferences()

  return sanitizePreferences(
    Object.fromEntries(
      Object.entries(STORAGE_KEYS).map(([key, storageKey]) => [key, storage.getItem(storageKey)])
    )
  )
}

export const saveLocalPreferences = preferences => {
  const storage = getStorage()
  if (!storage) return false

  try {
    const safePreferences = sanitizePreferences(preferences)
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      storage.setItem(storageKey, safePreferences[key])
    })
    return true
  } catch {
    return false
  }
}

export const preferencesFromRow = row => sanitizePreferences({
  theme: row?.theme,
  monthlyChart: row?.monthly_chart,
  yearlyChart: row?.yearly_chart,
  chartPalette: row?.chart_palette,
  accentColor: row?.accent_color,
  density: row?.density,
  initialView: row?.initial_view
})

export const preferencesToRow = (userId, preferences) => {
  const safePreferences = sanitizePreferences(preferences)

  return {
    user_id: userId,
    theme: safePreferences.theme,
    monthly_chart: safePreferences.monthlyChart,
    yearly_chart: safePreferences.yearlyChart,
    chart_palette: safePreferences.chartPalette,
    accent_color: safePreferences.accentColor,
    density: safePreferences.density,
    initial_view: safePreferences.initialView,
    updated_at: new Date().toISOString()
  }
}
