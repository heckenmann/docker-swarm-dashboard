import { Badge } from 'react-bootstrap'
import { getStyleClassForState } from '../Helper'

const ServiceStatusBadge = ({ serviceState }) => {
  return (
    <Badge bg={getStyleClassForState(serviceState)} className="w-100">
      {serviceState}
    </Badge>
  )
}

export default ServiceStatusBadge
