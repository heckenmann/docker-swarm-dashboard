import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ServiceName } from '../../src/components/names/ServiceName'

describe('ServiceName', () => {
  test('renders name and buttons and calls handlers', () => {
  render(<ServiceName name="svc1" id="id1" />)
  expect(screen.getByText('svc1')).toBeInTheDocument()
  })
  test('supports hiding buttons and overlay usage', () => {
  const { queryByTitle, rerender } = render(<ServiceName name="svc1" id="id1" />)
  // overlay rendering
  rerender(<ServiceName name="svc1" id="id1" useOverlay={true} tooltipText="svc1" />)
  expect(queryByTitle('Open service: svc1')).toBeNull()
  expect(queryByTitle('Filter service: svc1')).toBeNull()
  })
  test('returns null when name is empty', () => {
    const { container } = render(<ServiceName name={''} />)
    expect(container.firstChild).toBeNull()
  })
})
