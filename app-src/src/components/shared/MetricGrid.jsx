import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col } from 'react-bootstrap'

/**
 * MetricGrid - A layout component for arranging metric cards in a responsive grid.
 *
 * Automatically pairs children into rows with two columns each (on medium screens and up).
 * Falls back to single column layout for smaller screens.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Metric cards or other content to arrange
 * @param {string} [props.className=''] - Additional CSS classes for the container
 * @param {object} [props.cols={ base: 12, md: 6 }] - Column configuration for responsive layout with base and md keys
 * @param {string} [props.gutterClass='mb-3'] - CSS class for row gutters/spacing
 * @returns {JSX.Element}
 */
const MetricGrid = ({
  children,
  className = '',
  cols = { base: 12, md: 6 },
  gutterClass = 'mb-3',
}) => {
  const colClass = `col-${cols.base} ${cols.md ? `col-md-${cols.md}` : ''}`
  const validChildren = React.Children.toArray(children).filter(Boolean)

  if (validChildren.length > 1) {
    const pairs = []
    for (let i = 0; i < validChildren.length; i += 2) {
      pairs.push([validChildren[i], validChildren[i + 1] || null])
    }
    return (
      <div className={className}>
        {pairs.map((pair, idx) => (
          <Row key={idx} className={gutterClass}>
            <Col className={colClass}>{pair[0]}</Col>
            {pair[1] && <Col className={colClass}>{pair[1]}</Col>}
          </Row>
        ))}
      </div>
    )
  }

  return (
    <Row className={gutterClass}>
      <Col className={colClass}>{validChildren[0] || null}</Col>
    </Row>
  )
}

MetricGrid.propTypes = {
  /** Metric cards or other content to arrange */
  children: PropTypes.node,
  /** Additional CSS classes for the container */
  className: PropTypes.string,
  /** Column configuration for responsive layout */
  cols: PropTypes.shape({
    /** Column width for base (mobile) screens */
    base: PropTypes.number,
    /** Column width for medium screens and up */
    md: PropTypes.number,
  }),
  /** CSS class for row gutters/spacing */
  gutterClass: PropTypes.string,
}

export default MetricGrid
