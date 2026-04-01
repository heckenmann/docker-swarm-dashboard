import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * Reusable sortable table header component
 */
const SortableHeader = React.memo(function SortableHeader({
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
      className={['text-nowrap', className].filter(Boolean).join(' ')}
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
})

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func.isRequired,
  style: PropTypes.object,
  className: PropTypes.string,
}

export default SortableHeader
