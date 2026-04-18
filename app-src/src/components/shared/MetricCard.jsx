import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Card, Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'

const MetricCard = ({
  title,
  icon,
  loading = false,
  error = null,
  children,
  className = '',
  bodyClassName = '',
  chartContent = false,
  noBody = false,
}) => {
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

  if (loading) {
    return (
      <Card className={`${currentVariantClasses} ${className}`}>
        <Card.Header className="d-flex align-items-center">
          {icon && <FontAwesomeIcon icon={icon} className="me-2 text-muted" />}
          <span className="text-muted">{title || 'Loading...'}</span>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          <span className="text-muted">Loading...</span>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${currentVariantClasses} ${className}`}>
        <Card.Header className="d-flex align-items-center">
          {icon && <FontAwesomeIcon icon={icon} className="me-2 text-muted" />}
          <span>{title}</span>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning" className="mb-0">
            <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
            {error}
          </Alert>
        </Card.Body>
      </Card>
    )
  }

  const finalBodyClass = bodyClassName || (chartContent ? 'p-2' : '')

  return (
    <Card className={`${currentVariantClasses} ${className}`}>
      <Card.Header className="d-flex align-items-center">
        {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
        <span>{title}</span>
      </Card.Header>
      {noBody ? (
        children
      ) : (
        <Card.Body className={finalBodyClass}>{children}</Card.Body>
      )}
    </Card>
  )
}

MetricCard.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  chartContent: PropTypes.bool,
  noBody: PropTypes.bool,
}

export default MetricCard
