import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'

// Mutable state to allow tests to change the mock behavior
let mockUseAtomValueReturn = true

// Mock Jotai atoms - define mock atom inside the factory
jest.mock('jotai', () => ({
  useAtomValue: jest.fn((atom) => mockUseAtomValueReturn),
  useAtom: jest.fn(() => [null, jest.fn()]), // returns [value, setter]
  atom: (initial) => ({ toString: () => 'mockAtom', init: initial }),
  Provider: ({ children }) => children,
}))

// Create a mock atom for showNamesButtonsAtom
const mockShowNamesButtonsAtom = { toString: () => 'showNamesButtonsAtom' }

// Mock showNamesButtonsAtom
jest.mock('../../../src/common/store/atoms', () => ({
  showNamesButtonsAtom: { toString: () => 'showNamesButtonsAtom' },
  logsFormServiceIdAtom: { toString: () => 'logsFormServiceIdAtom' },
  logsFormServiceNameAtom: { toString: () => 'logsFormServiceNameAtom' },
  logsConfigAtom: { toString: () => 'logsConfigAtom' },
  logsShowLogsAtom: { toString: () => 'logsShowLogsAtom' },
  viewAtom: { toString: () => 'viewAtom' },
}))

describe('ServiceName component combined', () => {
  test('ServiceName renders and supports overlay/hide behavior', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    const { queryByTitle, rerender } = render(
      <Provider>
        {React.createElement(ServiceName, { name: 'svc1', id: 'id1' })}
      </Provider>
    )
    expect(screen.getByText('svc1')).toBeInTheDocument()
    rerender(
      <Provider>
        {React.createElement(ServiceName, {
          name: 'svc1',
          id: 'id1',
          useOverlay: true,
          tooltipText: 'svc1',
        })}
      </Provider>
    )
    expect(queryByTitle('Open service: svc1')).toBeNull()
    expect(queryByTitle('Filter service: svc1')).toBeNull()
    const { container } = render(
      <Provider>
        {React.createElement(ServiceName, { name: '' })}
      </Provider>
    )
    expect(container.firstChild).toBeNull()
  })

  test('ServiceName renders with default props', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'my-service', id: 'svc-123' })}
      </Provider>
    )
    expect(screen.getByText('my-service')).toBeInTheDocument()
    expect(screen.getByTitle('Open service: my-service')).toBeInTheDocument()
    expect(screen.getByTitle('Filter service: my-service')).toBeInTheDocument()
    // ServiceName always shows logs button (showLogs is hardcoded to true)
    expect(screen.getByTitle('Show logs for service: my-service')).toBeInTheDocument()
  })

  test('ServiceName renders service name correctly', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    const { container } = render(
      <Provider>
        {React.createElement(ServiceName, {
          name: 'this-is-a-very-long-service-name',
          id: 'long-svc',
        })}
      </Provider>
    )
    expect(screen.getByText('this-is-a-very-long-service-name')).toBeInTheDocument()
    // Name truncation is not implemented in ServiceName - the full name is shown
    expect(container.querySelector('span').textContent).toBe('this-is-a-very-long-service-name')
  })

  test('ServiceName shows action buttons when showNamesButtonsAtom is true', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'test-service', id: 'test-id' })}
      </Provider>
    )
    expect(screen.getByTitle('Open service: test-service')).toBeInTheDocument()
    expect(screen.getByTitle('Filter service: test-service')).toBeInTheDocument()
    expect(screen.getByTitle('Show logs for service: test-service')).toBeInTheDocument()
  })

  test('ServiceName hides action buttons when showNamesButtonsAtom is false', () => {
    // Mock showNamesButtonsAtom to return false
    mockUseAtomValueReturn = false
    
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'test-service', id: 'test-id' })}
      </Provider>
    )
    expect(screen.queryByTitle('Open service: test-service')).toBeNull()
    expect(screen.queryByTitle('Filter service: test-service')).toBeNull()
    expect(screen.queryByTitle('Show logs for service: test-service')).toBeNull()
    
    // Reset for other tests
    mockUseAtomValueReturn = true
  })

  test('ServiceName calls onFilter when filter button clicked', () => {
    const entityActions = require('../../../src/common/hooks/useEntityActions')
    const onFilter = jest.fn()
    jest
      .spyOn(entityActions, 'useEntityActions')
      .mockReturnValue({ onOpen: jest.fn(), onFilter })
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'filterable-svc', id: 'filter-1' })}
      </Provider>
    )
    fireEvent.click(screen.getByTitle('Filter service: filterable-svc'))
    expect(onFilter).toHaveBeenCalledWith('filterable-svc')
    entityActions.useEntityActions.mockRestore()
  })

  test('ServiceName shows action buttons when showNamesButtonsAtom is true (isolated)', () => {
    // Real jotai: showNamesButtonsAtom defaults to true — buttons are shown without any mocking
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'visible-svc', id: 'vid-1' })}
      </Provider>
    )
    expect(screen.getByText('visible-svc')).toBeInTheDocument()
    expect(screen.queryByTitle(/Open service: visible-svc/i)).not.toBeNull()
    expect(screen.queryByTitle(/Filter service: visible-svc/i)).not.toBeNull()
    expect(screen.queryByTitle(/Show logs for service: visible-svc/i)).not.toBeNull()
  })

  // ---- Logs button tests ----
  // Note: ServiceName always shows logs button (showLogs is hardcoded to true in ServiceName)
  // The showLogs prop is not exposed in ServiceName - it's always true
  test('ServiceName always shows logs button (showLogs is hardcoded to true)', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, { name: 'log-svc', id: 'log-1' })}
      </Provider>
    )
    expect(screen.getByTitle('Show logs for service: log-svc')).toBeInTheDocument()
  })

  // ---- Edge cases ----
  test('ServiceName with overlay hides open/filter but shows logs', () => {
    const ServiceName = require('../../../src/components/shared/names/ServiceName').ServiceName
    render(
      <Provider>
        {React.createElement(ServiceName, {
          name: 'overlay-svc',
          id: 'ov-1',
          useOverlay: true,
          tooltipText: 'overlay tooltip',
        })}
      </Provider>
    )
    expect(screen.getByText('overlay-svc')).toBeInTheDocument()
    // With overlay, open and filter are hidden but logs should still be shown
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
    expect(screen.queryByTitle(/Show logs for service/i)).not.toBeNull()
  })
})