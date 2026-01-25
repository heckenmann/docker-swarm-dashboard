/**
 * EntityName
 * Generic component that renders a textual entity name and an adjacent set of
 * action buttons (open / filter). Callers can pass a custom `nameNode` to
 * control how the name itself is rendered (for example an OverlayTrigger).
 *
 * @param {Object} props
 * @param {string} props.name - Display name for the entity
 * @param {string|null} [props.id] - Optional entity id used by open handler
 * @param {function(string):void} [props.onOpen] - Optional handler to open details
 * @param {function(string):void} [props.onFilter] - Optional handler to apply filter
 * @param {boolean} [props.showOpen=true] - Whether to show the open (search) action
 * @param {boolean} [props.showFilter=true] - Whether to show the filter action
 * @param {string} [props.size='sm'] - Size passed to action buttons
 * @param {string} [props.nameClass] - Class applied to the rendered name node
 * @param {string|null} [props.tooltipText] - Optional tooltip text
 * @param {React.ReactNode|null} [props.nameNode] - Optional pre-built name node
 * @param {string} [props.entityType='service'] - Type of entity (service|stack|node)
 * @returns {JSX.Element|null}
 */
import React from 'react'
import { NameActions } from './NameActions'
import { useEntityActions } from '../../common/actions/entityActions'

export function EntityName({
  name,
  id,
  onOpen,
  onFilter,
  showOpen = true,
  showFilter = true,
  size = 'sm',
  nameClass = '',
  tooltipText = null,
  nameNode = null,
  entityType = 'service',
}) {
  if (!name) return null

  const defaultNameNode = (
    <span className={nameClass ? nameClass : ''} title={tooltipText || undefined}>
      {name}
    </span>
  )

  // Use centralized actions hook to provide defaults when props are omitted.
  const { onOpen: hookOnOpen, onFilter: hookOnFilter } = useEntityActions(entityType)
  const finalOnOpen = onOpen || hookOnOpen
  const finalOnFilter = onFilter || hookOnFilter

  return (
    <>
      {nameNode || defaultNameNode}
      <div className={`${(showOpen || showFilter) ? 'ms-1' : 'ms-0'} d-inline-flex gap-1`}>
        <NameActions
          showOpen={showOpen}
          showFilter={showFilter}
          size={size}
          onOpen={finalOnOpen}
          onFilter={finalOnFilter}
          name={name}
          id={id}
          entityType={entityType}
        />
      </div>
    </>
  )
}
