export function describeDataError(error, action = 'cargar los datos') {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'Sin conexión. Vuelve a intentarlo cuando recuperes internet.'
  if (['42501', 'PGRST301', 'PGRST302'].includes(error?.code)) return 'No tienes acceso a estos datos. Vuelve a iniciar sesión.'
  if (['42P01', 'PGRST205', 'PGRST200'].includes(error?.code)) return 'Esta función necesita actualizar la base de datos. Aplica la migración pendiente.'
  return `No se pudieron ${action}. Vuelve a intentarlo.`
}
