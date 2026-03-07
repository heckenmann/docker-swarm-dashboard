import React, { useMemo } from 'react'
import { getStyleClassForState } from '../Helper'
import PropTypes from 'prop-types'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { useAtomValue } from 'jotai'
import { dashboardSettingsAtom } from '../common/store/atoms'
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'

/**
 * Component to display a service status badge with optional tooltip information.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.id - The unique identifier for the service.
 * @param {string} props.serviceState - The current state of the service.
 * @param {string} [props.createdAt] - The creation timestamp of the service.
 * @param {string} [props.updatedAt] - The last updated timestamp of the service.
 * @param {string} [props.serviceError] - Any error message related to the service.
 * @param {string[]} [props.hiddenStates] - List of states that should not be displayed.
 */
const ServiceStatusBadge = ({
  id,
  serviceState,
  createdAt,
  updatedAt,
  serviceError,
  hiddenStates = [],
}) => {
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  const variant = useMemo(
    () => getStyleClassForState(serviceState),
    [serviceState],
  )

  const formattedCreated = useMemo(() => {
    if (!createdAt) return null
    try {
      return toDefaultDateTimeString(
        new Date(createdAt),
        dashBoardSettings.locale,
        dashBoardSettings.timeZone,
      )
    } catch {
      return String(createdAt)
    }
  }, [createdAt, dashBoardSettings.locale, dashBoardSettings.timeZone])

  const formattedUpdated = useMemo(() => {
    if (!updatedAt) return null
    try {
      return toDefaultDateTimeString(
        new Date(updatedAt),
        dashBoardSettings.locale,
        dashBoardSettings.timeZone,
      )
    } catch {
      return String(updatedAt)
    }
  }, [updatedAt, dashBoardSettings.locale, dashBoardSettings.timeZone])

  // Early return after all hooks
  if (Array.isArray(hiddenStates) && hiddenStates.includes(serviceState)) {
    return null
  }

  const hasTooltipContent = formattedCreated || formattedUpdated || serviceError
  const tooltipOverlay = hasTooltipContent ? (
    <Tooltip
      id={`tooltip-task-status-state-${id}`}
      className="service-status-tooltip"
    >
      {formattedCreated && <div>Created at: {formattedCreated}</div>}
      {formattedUpdated && <div>Updated at: {formattedUpdated}</div>}
      {serviceError && <div>{serviceError}</div>}
    </Tooltip>
  ) : null

  const ariaLabel = `Service state: ${serviceState}`

  const badge = (
    <Badge
      bg={variant}
      className="w-100"
      pill
      title={serviceState}
      aria-label={ariaLabel}
      role="status"
    >
      {serviceState}
    </Badge>
  )

  if (tooltipOverlay) {
    return (
      <OverlayTrigger placement="top" delay={100} overlay={tooltipOverlay}>
        {badge}
      </OverlayTrigger>
    )
  }

  return badge
}

/**
 * PropTypes for the ServiceStatusBadge component.
 */
ServiceStatusBadge.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  serviceState: PropTypes.string.isRequired,
  createdAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  updatedAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  serviceError: PropTypes.string,
  hiddenStates: PropTypes.arrayOf(PropTypes.string),
}

export default React.memo(ServiceStatusBadge)
