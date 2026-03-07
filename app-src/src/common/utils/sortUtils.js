/**
 * Generic sorting function for arrays of objects
 * @param {Array} data - The array to sort
 * @param {string|null} sortBy - The property to sort by
 * @param {string} sortDirection - The sort direction ('asc' or 'desc')
 * @param {Object} columnTypes - Map of column names to their types ('string', 'number', 'date')
 * @returns {Array} The sorted array
 */
export function sortData(data, sortBy, sortDirection, columnTypes = {}) {
  if (!sortBy) return data

  return [...data].sort((a, b) => {
    const columnType = columnTypes[sortBy] || 'string'
    let aValue, bValue

    // Get the values based on column type
    switch (columnType) {
      case 'date':
        aValue = new Date(a[sortBy] || 0).getTime()
        bValue = new Date(b[sortBy] || 0).getTime()
        break
      case 'number':
        aValue = a[sortBy] || 0
        bValue = b[sortBy] || 0
        break
      default:
        aValue = a[sortBy] || ''
        bValue = b[sortBy] || ''
    }

    // Compare values
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
}
