import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { Card, Spinner, Alert } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { currentVariantClassesAtom } from '../../common/store/atoms/themeAtoms'

/**
 * MetricCard - A reusable card component for displaying metric data with consistent styling.
 *
 * Provides standardized loading, error, and content states for metric visualizations.
 * Automatically adapts to the current Bootstrap theme variant.
 *
 * @param {Object} props
 * @param {string} [props.title] - The title displayed in the card header
 * @param {string} [props.icon] - FontAwesome icon name for the header
 * @param {boolean} [props.loading=false] - Whether to show loading state
 * @param {string} [props.error=null] - Error message to display (trumps content)
 * @param {React.ReactNode} [props.children] - Content to render inside the card
 * @param {string} [props.className=''] - Additional CSS classes for the card
 * @param {string} [props.bodyClassName=''] - Additional CSS classes for card body
 * @param {boolean} [props.chartContent=false] - Whether content is a chart (applies p-2 padding)
 * @param {boolean} [props.noBody=false] - Whether to render children without Card.Body wrapper
 * @returns {JSX.Element}
 */
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
  /** The title displayed in the card header */
  title: PropTypes.string,
  /** FontAwesome icon name for the header */
  icon: PropTypes.string,
  /** Whether to show loading state */
  loading: PropTypes.bool,
  /** Error message to display (trumps content) */
  error: PropTypes.string,
  /** Content to render inside the card */
  children: PropTypes.node,
  /** Additional CSS classes for the card */
  className: PropTypes.string,
  /** Additional CSS classes for card body */
  bodyClassName: PropTypes.string,
  /** Whether content is a chart (applies p-2 padding) */
  chartContent: PropTypes.bool,
  /** Whether to render children without Card.Body wrapper */
  noBody: PropTypes.bool,
}

export default MetricCard
