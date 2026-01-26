import { getStyleClassForState } from '../Helper'
import PropTypes from 'prop-types'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'
import { useAtomValue } from 'jotai'
import { dashboardSettingsAtom } from '../common/store/atoms'

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
  if (hiddenStates.includes(serviceState)) {
    return
  }
  const dashBoardSettings = useAtomValue(dashboardSettingsAtom)
  if (createdAt || updatedAt || serviceError) {
    return (
      <OverlayTrigger
        placement="top"
        delay={100}
        overlay={
          <Tooltip
            id={`tooltip-task-status-sate-${id}`}
            className="service-status-tooltip"
          >
            {createdAt && (
              <span>
                Created at:{' '}
                {toDefaultDateTimeString(
                  new Date(createdAt),
                  dashBoardSettings.locale,
                  dashBoardSettings.timeZone,
                )}
                <br />
              </span>
            )}
            {updatedAt && (
              <span>
                Updated at:{' '}
                {toDefaultDateTimeString(
                  new Date(updatedAt),
                  dashBoardSettings.locale,
                  dashBoardSettings.timeZone,
                )}
                <br />
              </span>
            )}
            {serviceError && <span>{serviceError}</span>}
          </Tooltip>
        }
      >
        <Badge bg={getStyleClassForState(serviceState)} className="w-100">
          {serviceState}
        </Badge>
      </OverlayTrigger>
    )
  }
  return (
    <Badge bg={getStyleClassForState(serviceState)} className="w-100">
      {serviceState}
    </Badge>
  )
}

/**
 * PropTypes for the ServiceStatusBadge component.
 */
ServiceStatusBadge.propTypes = {
  id: PropTypes.number.isRequired,
  serviceState: PropTypes.string.isRequired,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
  serviceError: PropTypes.string,
  hiddenStates: PropTypes.arrayOf(PropTypes.string),
}

/**
 * Default props for the ServiceStatusBadge component.
 */
ServiceStatusBadge.defaultProps = {
  hiddenStates: [],
}

export default ServiceStatusBadge
