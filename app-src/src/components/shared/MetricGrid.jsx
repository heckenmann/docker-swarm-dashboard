import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col } from 'react-bootstrap'

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
  children: PropTypes.node,
  className: PropTypes.string,
  cols: PropTypes.shape({
    base: PropTypes.number,
    md: PropTypes.number,
  }),
  gutterClass: PropTypes.string,
}

export default MetricGrid
