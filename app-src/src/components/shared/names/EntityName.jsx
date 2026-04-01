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
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { useEntityActions } from '../../../common/hooks/useEntityActions'
import NameActions from './NameActions'
import { showNamesButtonsAtom } from '../../../common/store/atoms/uiAtoms'

const EntityName = React.memo(function EntityName({
  name,
  id,
  onOpen,
  onFilter,
  showOpen = true,
  showFilter = true,
  showLogs = false,
  onLogs,
  size = 'sm',
  nameClass = '',
  tooltipText = null,
  nameNode = null,
  entityType = 'service',
}) {
  const { onOpen: hookOnOpen, onFilter: hookOnFilter } =
    useEntityActions(entityType)
  const showNamesButtons = useAtomValue(showNamesButtonsAtom)

  if (!name) return null

  const finalOnOpen = onOpen || hookOnOpen
  const finalOnFilter = onFilter || hookOnFilter

  const defaultNameNode = (
    <span
      className={nameClass ? nameClass : ''}
      title={tooltipText || undefined}
    >
      {name}
    </span>
  )

  const showAnyAction = showOpen || showFilter || showLogs

  return (
    <>
      {nameNode || defaultNameNode}
      <div
        className={`${showAnyAction && showNamesButtons ? 'ms-1' : 'ms-0'} d-inline-flex gap-1`}
      >
        {showAnyAction && showNamesButtons && (
          <NameActions
            showOpen={showOpen}
            showFilter={showFilter}
            showLogs={showLogs}
            size={size}
            onOpen={finalOnOpen}
            onFilter={finalOnFilter}
            onLogs={onLogs}
            name={name}
            id={id}
            entityType={entityType}
          />
        )}
      </div>
    </>
  )
})

EntityName.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  onOpen: PropTypes.func,
  onFilter: PropTypes.func,
  showOpen: PropTypes.bool,
  showFilter: PropTypes.bool,
  showLogs: PropTypes.bool,
  onLogs: PropTypes.func,
  size: PropTypes.string,
  nameClass: PropTypes.string,
  tooltipText: PropTypes.string,
  nameNode: PropTypes.node,
  entityType: PropTypes.string,
}

export default EntityName
