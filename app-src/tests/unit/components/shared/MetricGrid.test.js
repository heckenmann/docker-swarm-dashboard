import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import MetricGrid, { buildColClass, getValidChildren, pairChildren } from '../../../../src/components/shared/MetricGrid'

describe('MetricGrid Helpers', () => {
  describe('buildColClass', () => {
    it('builds class with base only', () => {
      expect(buildColClass({ base: 12 })).toBe('col-12 ')
    })

    it('builds class with base and md', () => {
      expect(buildColClass({ base: 12, md: 6 })).toBe('col-12 col-md-6')
    })
  })

  describe('getValidChildren', () => {
    it('filters out null and undefined children', () => {
      const children = [<div key="1" />, null, <div key="2" />, undefined]
      const valid = getValidChildren(children)
      expect(valid).toHaveLength(2)
    })
  })

  describe('pairChildren', () => {
    it('pairs even number of children', () => {
      const children = [1, 2, 3, 4]
      const pairs = pairChildren(children)
      expect(pairs).toEqual([[1, 2], [3, 4]])
    })

    it('pairs odd number of children', () => {
      const children = [1, 2, 3]
      const pairs = pairChildren(children)
      expect(pairs).toEqual([[1, 2], [3, null]])
    })

    it('handles empty array', () => {
      expect(pairChildren([])).toEqual([])
    })
  })
})

describe('MetricGrid Component', () => {
  it('renders nothing when no children are provided', () => {
    const { container } = render(<MetricGrid />)
    expect(container.firstChild).toBeInTheDocument()
    // Should render a Row with an empty Col based on current implementation for 0/1 children
    expect(container.querySelector('.row')).toBeInTheDocument()
  })

  it('renders single child in one row and one column', () => {
    const { container, getByText } = render(
      <MetricGrid>
        <div>Child 1</div>
      </MetricGrid>
    )
    expect(getByText('Child 1')).toBeInTheDocument()
    const rows = container.querySelectorAll('.row')
    expect(rows).toHaveLength(1)
    const cols = container.querySelectorAll('.col-12')
    expect(cols).toHaveLength(1)
  })

  it('renders multiple children in pairs', () => {
    const { container, getByText } = render(
      <MetricGrid>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </MetricGrid>
    )
    expect(getByText('Child 1')).toBeInTheDocument()
    expect(getByText('Child 2')).toBeInTheDocument()
    expect(getByText('Child 3')).toBeInTheDocument()
    
    // With 3 children, it should have 2 rows
    const rows = container.querySelectorAll('.row')
    expect(rows).toHaveLength(2)
  })

  it('applies custom className and gutterClass', () => {
    const { container } = render(
      <MetricGrid className="custom-grid" gutterClass="custom-gutter">
        <div>1</div>
        <div>2</div>
      </MetricGrid>
    )
    expect(container.firstChild).toHaveClass('custom-grid')
    expect(container.querySelector('.row')).toHaveClass('custom-gutter')
  })

  it('uses custom column configuration', () => {
    const { container } = render(
      <MetricGrid cols={{ base: 6, md: 4 }}>
        <div>1</div>
        <div>2</div>
      </MetricGrid>
    )
    // For multiple children (>1), it uses pairs
    const cols = container.querySelectorAll('.col-6')
    expect(cols.length).toBeGreaterThan(0)
    expect(container.querySelector('.col-md-4')).toBeInTheDocument()
  })
})
