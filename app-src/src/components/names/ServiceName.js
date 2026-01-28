import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { EntityName } from './EntityName'
import { useAtom, useAtomValue } from 'jotai'
import {
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsConfigAtom,
  logsShowLogsAtom,
} from '../../common/store/atoms'
import { viewAtom } from '../../common/store/atoms'
import { logsId } from '../../common/navigationConstants'

/**
 * ServiceName
 * Presentational wrapper for service names. Optionally wraps the rendered name
 * with a Bootstrap Overlay/Tooltip and delegates action rendering to
 * `EntityName`.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.id
 * @param {string} [props.nameClass]
 * @param {boolean} [props.useOverlay=false]
 * @param {string|null} [props.tooltipText]
 * (Handlers are centralized; callers should not pass onOpen/onFilter)
 * @param {boolean} [props.showOpen=true]
 * @param {boolean} [props.showFilter=true]
 * @param {string} [props.size='sm']
 */

function ServiceName({
  name,
  id,
  nameClass = '',
  useOverlay = false,
  tooltipText = null,
  showOpen = true,
  showFilter = true,
  size = 'sm',
}) {
  if (!name) return null

  const nameNode = (
    <span
      className={nameClass ? nameClass : ''}
      title={tooltipText || undefined}
    >
      {name}
    </span>
  )

  const wrappedNameNode =
    useOverlay && tooltipText ? (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tt-${id}`}>{tooltipText}</Tooltip>}
      >
        {nameNode}
      </OverlayTrigger>
    ) : (
      nameNode
    )

  const [, setFormId] = useAtom(logsFormServiceIdAtom)
  const [, setFormName] = useAtom(logsFormServiceNameAtom)
  const [, setLogsConfig] = useAtom(logsConfigAtom)
  const [logsShowLogsVal, setLogsShowLogs] = useAtom(logsShowLogsAtom)

  const logsConfigVal = useAtomValue(logsConfigAtom)
  const [, updateView] = useAtom(viewAtom)

  const handleShowLogs = (sid) => {
    // If logs are currently being streamed (follow), close them first
    if (logsShowLogsVal && logsConfigVal?.follow) {
      setLogsShowLogs(false)
      setLogsConfig(null)
    }
    // Prefill the logs form but DO NOT start streaming or set the active logs config.
    setFormId(sid)
    setFormName(name)
    // Only set the service id/name for the logs form; do NOT modify other
    // form atoms so we don't overwrite user state.

    // Navigate to logs view; the form will be shown because logsShowLogs is false
    updateView((prev) => ({ ...prev, id: logsId }))
  }

  return (
    <EntityName
      name={name}
      id={id}
      showOpen={useOverlay ? false : showOpen}
      showFilter={useOverlay ? false : showFilter}
      showLogs={true}
      onLogs={handleShowLogs}
      size={size}
      nameClass={nameClass}
      tooltipText={tooltipText}
      nameNode={wrappedNameNode}
      entityType="service"
    />
  )
}

export { ServiceName }
