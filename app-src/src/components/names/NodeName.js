/**
 * NodeName
 * Thin wrapper around `EntityName` for node entities. By default nodes don't
 * show a filter button. Navigation and filtering handlers are provided
 * centrally; callers should not pass `onOpen`.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.id
 * @param {function(string):void} [props.onOpen]
 * @param {boolean} [props.showOpen=true]
 * @param {string} [props.size='sm']
 * @param {string} [props.nameClass]
 */

function NodeName({ name, id, showOpen = true, size = 'sm', nameClass = '' }) {
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
}

export { NodeName }
