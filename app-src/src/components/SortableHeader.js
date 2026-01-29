import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * Reusable sortable table header component
 * @param {string} column - The column name to sort by
 * @param {string} label - The display label
 * @param {string|null} sortBy - The current sort column
 * @param {string} sortDirection - The current sort direction ('asc' or 'desc')
 * @param {Function} onSort - Callback function when header is clicked
 * @param {object} style - Optional style object
 * @param {string} className - Optional className
 */
export function SortableHeader({
  column,
  label,
  sortBy,
  sortDirection,
  onSort,
  style,
  className,
}) {
  const isSorted = sortBy === column
  const sortState = isSorted
    ? sortDirection === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  const handleClick = () => onSort(column)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSort(column)
    }
  }

  return (
    <th
      role="button"
      tabIndex={0}
      aria-sort={sortState}
      aria-label={`Sort by ${label}, currently ${sortState === 'none' ? 'unsorted' : sortState}`}
      style={{ ...style, cursor: 'pointer' }}
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {label}{' '}
      {isSorted ? (
        <FontAwesomeIcon
          icon={sortDirection === 'asc' ? 'sort-up' : 'sort-down'}
        />
      ) : (
        <FontAwesomeIcon icon="sort" style={{ opacity: 0.3 }} />
      )}
    </th>
  )
}
