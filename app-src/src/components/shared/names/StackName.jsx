import React from 'react'
import PropTypes from 'prop-types'
import EntityName from './EntityName'

/**
 * StackName
 * Thin wrapper around `EntityName` for stack entities. It typically exposes
 * the filter action and delegates filtering to centralized handlers when
 * callers omit `onFilter`.
 *
 * @param {Object} props
 * @param {string} props.name
 * (Handlers are centralized; callers should not pass onFilter)
 * @param {boolean} [props.showFilter=true]
 * @param {string} [props.size='sm']
 * @param {string} [props.nameClass]
 */

const StackName = React.memo(function StackName({
  name,
  showFilter = true,
  size = 'sm',
  nameClass = '',
}) {
  if (!name) return null
  const nameNode = <span className={nameClass ? nameClass : ''}>{name}</span>
  return (
    <EntityName
      name={name}
      id={null}
      showOpen={false}
      showFilter={showFilter}
      size={size}
      nameClass={nameClass}
      nameNode={nameNode}
      entityType="stack"
    />
  )
})

StackName.propTypes = {
  name: PropTypes.string.isRequired,
  showFilter: PropTypes.bool,
  size: PropTypes.string,
  nameClass: PropTypes.string,
}

export default StackName
