import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col } from 'react-bootstrap'

/**
 * Build column class string from cols configuration
 * @param {object} cols - Column configuration
 * @param {number} cols.base - Base column width
 * @param {number} [cols.md] - Medium breakpoint column width
 * @returns {string} Bootstrap column class string
 */
export function buildColClass(cols) {
  return `col-${cols.base} ${cols.md ? `col-md-${cols.md}` : ''}`
}

/**
 * Filter out falsy children
 * @param {React.ReactNode} children - React children
 * @returns {Array} Valid children array
 */
export function getValidChildren(children) {
  return React.Children.toArray(children).filter(Boolean)
}

/**
 * Pair children into arrays of two
 * @param {Array} children - Array of children
 * @returns {Array<Array>} Pairs of children
 */
export function pairChildren(children) {
  const pairs = []
  for (let i = 0; i < children.length; i += 2) {
    pairs.push([children[i], children[i + 1] || null])
  }
  return pairs
}

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
  const colClass = buildColClass(cols)
  const validChildren = getValidChildren(children)

  if (validChildren.length > 1) {
    const pairs = pairChildren(validChildren)
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

export { buildColClass, getValidChildren, pairChildren }

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
