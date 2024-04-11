import { Badge } from 'react-bootstrap'
import { getStyleClassForState } from '../Helper'
import PropTypes from 'prop-types'

const ServiceStatusBadge = ({ serviceState, hiddenStates }) => {
  if (hiddenStates.includes(serviceState)) {
    return
  }
  return (
    <Badge bg={getStyleClassForState(serviceState)} className="w-100">
      {serviceState}
    </Badge>
  )
}

ServiceStatusBadge.propTypes = {
  serviceState: PropTypes.string.isRequired,
  hiddenStates: PropTypes.arrayOf(PropTypes.string),
}

ServiceStatusBadge.defaultProps = {
  hiddenStates: [],
}

export default ServiceStatusBadge
