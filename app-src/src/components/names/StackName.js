import { EntityName } from './EntityName'

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

function StackName({ name, showFilter = true, size = 'sm', nameClass = '' }) {
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
}

export { StackName }
