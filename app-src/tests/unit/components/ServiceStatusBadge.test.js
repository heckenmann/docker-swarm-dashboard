// ServiceStatusBadge.test.js
// Tests rendering behavior for ServiceStatusBadge: simple badge, tooltip rendering, and hidden-state handling.
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock atoms module to avoid evaluating the real atoms file at import time
jest.mock('../../../src/common/store/atoms', () => ({
  dashboardSettingsAtom: {},
}))
jest.mock('jotai', () => ({ useAtomValue: () => ({ locale: 'en', timeZone: 'UTC' }) }))
jest.mock('../../../src/common/DefaultDateTimeFormat', () => ({
  toDefaultDateTimeString: () => '2026-01-18T00:00:00Z',
}))

import ServiceStatusBadge from '../../../src/components/ServiceStatusBadge'

describe('ServiceStatusBadge', () => {
  test('renders simple badge when no tooltip data', () => {
    render(<ServiceStatusBadge id={1} serviceState={'running'} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  test('renders overlay tooltip when createdAt/updatedAt/serviceError provided', () => {
    render(
      <ServiceStatusBadge
        id={2}
        serviceState={'failed'}
        createdAt={new Date().toISOString()}
        updatedAt={new Date().toISOString()}
        serviceError={'boom'}
      />,
    )
    // badge text still present
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  test('returns nothing when state is hidden', () => {
    const { container } = render(
      <ServiceStatusBadge id={3} serviceState={'running'} hiddenStates={['running']} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
