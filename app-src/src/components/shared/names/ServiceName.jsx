import React, { startTransition } from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useAtom } from 'jotai'
import { useResetAtom } from 'jotai/utils'
import EntityName from './EntityName'
import {
  logsFormServiceIdAtom,
  logsFormServiceNameAtom,
  logsConfigAtom,
  logsLinesAtom,
  logsShowLogsAtom,
} from '../../../common/store/atoms/logsAtoms'
import { viewAtom } from '../../../common/store/atoms/navigationAtoms'
import { logsId } from '../../../common/navigationConstants'

/**
 * Internal function to handle logs button click
 * Extracted for better testability
 *
 * @param {object} params - Handler parameters
 * @param {string} params.serviceId - Service ID to preselect
 * @param {string} params.serviceName - Service name to preselect
 * @param {boolean} params.logsShowLogs - Whether a logs session is displayed
 * @param {Function} params.setLogsShowLogs - Setter for logs visibility
 * @param {Function} params.setLogsConfig - Setter for logs configuration
 * @param {Function} params.resetLogsLines - Clears the collected log lines
 * @param {Function} params.setFormId - Setter for form service ID
 * @param {Function} params.setFormName - Setter for form service name
 * @param {Function} params.updateView - Function to update the view
 */
export function handleShowLogsInternal({
  serviceId,
  serviceName,
  logsShowLogs,
  setLogsShowLogs,
  setLogsConfig,
  resetLogsLines,
  setFormId,
  setFormName,
  updateView,
}) {
  // Close any displayed logs session, streaming or not. The user asked for
  // another service, and an open session would keep showing the previous one
  // instead of the form prefilled below.
  if (logsShowLogs) {
    setLogsShowLogs(false)
    setLogsConfig(null)
    resetLogsLines()
  }
  // Prefill the logs form but DO NOT start streaming or set the active logs config.
  setFormId(serviceId)
  setFormName(serviceName)

  // Navigate to logs view; the form will be shown because logsShowLogs is false
  updateView((prev) => ({ ...prev, id: logsId }))
}

/**
 * ServiceName
 * Presentational wrapper for service names.
 */
const ServiceName = React.memo(function ServiceName({
  name,
  id,
  nameClass = '',
  useOverlay = false,
  tooltipText = null,
  showOpen = true,
  showFilter = true,
  size = 'sm',
}) {
  const [, setFormId] = useAtom(logsFormServiceIdAtom)
  const [, setFormName] = useAtom(logsFormServiceNameAtom)
  const [, setLogsConfig] = useAtom(logsConfigAtom)
  const [logsShowLogsVal, setLogsShowLogs] = useAtom(logsShowLogsAtom)
  const resetLogsLines = useResetAtom(logsLinesAtom)
  const [, updateView] = useAtom(viewAtom)

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

  const handleShowLogs = (sid) => {
    startTransition(() => {
      handleShowLogsInternal({
        serviceId: sid,
        serviceName: name,
        logsShowLogs: logsShowLogsVal,
        setLogsShowLogs,
        setLogsConfig,
        resetLogsLines,
        setFormId,
        setFormName,
        updateView,
      })
    })
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
})

ServiceName.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  nameClass: PropTypes.string,
  useOverlay: PropTypes.bool,
  tooltipText: PropTypes.string,
  showOpen: PropTypes.bool,
  showFilter: PropTypes.bool,
  size: PropTypes.string,
}

export default ServiceName
