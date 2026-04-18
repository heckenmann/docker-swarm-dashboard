import React from 'react'
import PropTypes from 'prop-types'
import EntityName from './EntityName'

/**
 * NodeName
 * Thin wrapper around `EntityName` for node entities. By default nodes don't
 * show a filter button. Navigation and filtering handlers are provided
 * centrally; callers should not pass `onOpen`.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.id
 * @param {function(string):void} [props.onOpen]
 * @param {boolean} [props.showOpen=true]
 * @param {string} [props.size='sm']
 * @param {string} [props.nameClass]
 */

const NodeName = React.memo(function NodeName({
  name,
  id,
  showOpen = true,
  size = 'sm',
  nameClass = '',
}) {
  if (!name) return null
  const nameNode = <span className={nameClass ? nameClass : ''}>{name}</span>
  return (
    <EntityName
      name={name}
      id={id}
      showOpen={showOpen}
      showFilter={false}
      size={size}
      nameClass={nameClass}
      nameNode={nameNode}
      entityType="node"
    />
  )
})

NodeName.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  showOpen: PropTypes.bool,
  size: PropTypes.string,
  nameClass: PropTypes.string,
}

export default NodeName
