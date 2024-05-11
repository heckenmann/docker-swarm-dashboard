import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { getStyleClassForState } from '../Helper'
import PropTypes from 'prop-types'
import { toDefaultDateTimeString } from '../common/DefaultDateTimeFormat'

const ServiceStatusBadge = ({
  id,
  serviceState,
  createdAt,
  updatedAt,
  serviceError,
  hiddenStates,
}) => {
  if (hiddenStates.includes(serviceState)) {
    return
  }
  if (createdAt || updatedAt || serviceError) {
    return (
      <OverlayTrigger
        placement="top"
        delay={100}
        overlay={
          <Tooltip id={`tooltip-task-status-sate-${id}`}>
            {createdAt && (
              <span>
                Created at: {toDefaultDateTimeString(new Date(createdAt))}
                <br />
              </span>
            )}
            {updatedAt && (
              <span>
                Updated at: {toDefaultDateTimeString(new Date(updatedAt))}
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

ServiceStatusBadge.propTypes = {
  id: PropTypes.number.isRequired,
  serviceState: PropTypes.string.isRequired,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
  serviceError: PropTypes.string,
  hiddenStates: PropTypes.arrayOf(PropTypes.string),
}

ServiceStatusBadge.defaultProps = {
  hiddenStates: [],
}

export default ServiceStatusBadge
