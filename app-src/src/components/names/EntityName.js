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
import { useEntityActions } from '../../common/actions/entityActions'
import { NameActions } from './NameActions'
import { useAtomValue } from 'jotai'
import { showNamesButtonsAtom } from '../../common/store/atoms'

export function EntityName({
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
  if (!name) return null

  const defaultNameNode = (
    <span
      className={nameClass ? nameClass : ''}
      title={tooltipText || undefined}
    >
      {name}
    </span>
  )

  // Use centralized actions hook to provide defaults when props are omitted.
  const { onOpen: hookOnOpen, onFilter: hookOnFilter } =
    useEntityActions(entityType)
  const finalOnOpen = onOpen || hookOnOpen
  const finalOnFilter = onFilter || hookOnFilter

  const showNamesButtons = useAtomValue(showNamesButtonsAtom)

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
}
