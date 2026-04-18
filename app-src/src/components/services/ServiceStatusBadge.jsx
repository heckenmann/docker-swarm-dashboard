import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { getStyleClassForState } from '../../common/utils/taskStateUtils'
import { toDefaultDateTimeString } from '../../common/DefaultDateTimeFormat'
import {
  hiddenServiceStatesAtom,
  timeZoneAtom,
  localeAtom,
} from '../../common/store/atoms/uiAtoms'
import './ServiceStatusBadge.css'

/**
 * Component to display a service status badge with optional tooltip information.
 *
 * @param {object} props - The properties object.
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
  const hiddenServiceStatesFromAtom = useAtomValue(hiddenServiceStatesAtom)
  const timeZone = useAtomValue(timeZoneAtom)
  const locale = useAtomValue(localeAtom)
  const variant = useMemo(
    () => getStyleClassForState(serviceState),
    [serviceState],
  )

  // Use hiddenStates prop if provided, otherwise fall back to atom value
  const effectiveHiddenStates =
    Array.isArray(hiddenStates) && hiddenStates.length > 0
      ? hiddenStates
      : hiddenServiceStatesFromAtom

  const formattedCreated = useMemo(() => {
    if (!createdAt) return null
    try {
      return toDefaultDateTimeString(new Date(createdAt), locale, timeZone)
    } catch {
      return String(createdAt)
    }
  }, [createdAt, locale, timeZone])

  const formattedUpdated = useMemo(() => {
    if (!updatedAt) return null
    try {
      return toDefaultDateTimeString(new Date(updatedAt), locale, timeZone)
    } catch {
      return String(updatedAt)
    }
  }, [updatedAt, locale, timeZone])

  // Early return after all hooks
  if (
    Array.isArray(effectiveHiddenStates) &&
    effectiveHiddenStates.includes(serviceState)
  ) {
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
