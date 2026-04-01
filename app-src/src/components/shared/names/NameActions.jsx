import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * NameActions
 * Stateless component that renders action buttons next to an entity name.
 * Each button stops propagation and calls the provided handlers.
 *
 * @param {Object} props
 * @param {boolean} [props.showOpen=true]
 * @param {boolean} [props.showFilter=true]
 * @param {string} [props.size='sm']
 * @param {function(string):void} [props.onOpen]
 * @param {function(string):void} [props.onFilter]
 * @param {string} [props.name]
 * @param {string} [props.id]
 * @param {string} [props.entityType]
 * @returns {JSX.Element}
 */

const NameActions = React.memo(function NameActions({
  showOpen = true,
  showFilter = true,
  size = 'sm',
  onOpen,
  onFilter,
  onLogs,
  showLogs = false,
  name,
  id,
  entityType = 'service',
}) {
  return (
    <>
      {showOpen && (
        <Button
          className="name-open-btn"
          size={size}
          title={`Open ${entityType}: ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen && onOpen(id)
          }}
        >
          <FontAwesomeIcon icon="search" />
        </Button>
      )}
      {showFilter && (
        <Button
          className="name-filter-btn"
          size={size}
          title={`Filter ${entityType}: ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            onFilter && onFilter(name)
          }}
        >
          <FontAwesomeIcon icon="filter" />
        </Button>
      )}
      {showLogs && (
        <Button
          className="name-logs-btn"
          size={size}
          title={`Show logs for ${entityType}: ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            onLogs && onLogs(id)
          }}
        >
          <FontAwesomeIcon icon="desktop" />
        </Button>
      )}
    </>
  )
})

NameActions.propTypes = {
  showOpen: PropTypes.bool,
  showFilter: PropTypes.bool,
  size: PropTypes.string,
  onOpen: PropTypes.func,
  onFilter: PropTypes.func,
  onLogs: PropTypes.func,
  showLogs: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  entityType: PropTypes.string,
}

export default NameActions
