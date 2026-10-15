// Rebuild each query so range modifiers never leak between requests.
export const fetchAllRows = async (createQuery, pageSize = 500) => {
  const rows = []
  try {
    for (;;) {
      const { data, error } = await createQuery().range(rows.length, rows.length + pageSize - 1)
      if (error) return { data: null, error }
      if (!data?.length) return { data: rows, error: null }
      rows.push(...data)
    }
  } catch (error) {
    return { data: null, error }
  }
}
