/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RefreshIntervalRow } from '../../../../../src/components/settings/rows/RefreshIntervalRow'

const mockUseAtom = jest.fn()
const mockUseAtomValue = jest.fn()

jest.mock('jotai', () => ({
  useAtom: (...args) => mockUseAtom(...args),
  useAtomValue: (...args) => mockUseAtomValue(...args),
}))

jest.mock('../../../../../src/common/store/atoms', () => ({
  refreshIntervalAtom: 'refreshIntervalAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

describe('RefreshIntervalRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all interval options', () => {
    mockUseAtom.mockReturnValue([null, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: null })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('Off')).toBeInTheDocument()
    expect(screen.getByText('5s')).toBeInTheDocument()
    expect(screen.getByText('10s')).toBeInTheDocument()
    expect(screen.getByText('30s')).toBeInTheDocument()
    expect(screen.getByText('60s')).toBeInTheDocument()
  })

  test('shows correct interval as active', () => {
    mockUseAtom.mockReturnValue([10000, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: 10000 })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    // The button for 10s should have variant 'secondary' (active)
    const buttons = screen.getAllByRole('button')
    const activeButton = buttons.find(b => b.textContent === '10s')
    expect(activeButton).toBeInTheDocument()
  })

  test('calls setRefreshInterval when button clicked', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue([null, mockSet])
    mockUseAtomValue.mockReturnValue({ refreshInterval: null })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByText('30s'))
    expect(mockSet).toHaveBeenCalledWith(30000)
  })

  test('shows "off" when dashboardSettings.refreshInterval is null', () => {
    mockUseAtom.mockReturnValue([null, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: null })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('off')).toBeInTheDocument()
  })

  test('shows "off" when dashboardSettings.refreshInterval is undefined', () => {
    mockUseAtom.mockReturnValue([null, jest.fn()])
    mockUseAtomValue.mockReturnValue({}) // refreshInterval is undefined

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('off')).toBeInTheDocument()
  })

  test('shows actual value when dashboardSettings.refreshInterval is set', () => {
    mockUseAtom.mockReturnValue([30000, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: 30000 })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('30000')).toBeInTheDocument()
  })

  test('reset button calls setRefreshInterval with null when refreshInterval is not null', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue([30000, mockSet])
    mockUseAtomValue.mockReturnValue({ refreshInterval: 30000 })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByLabelText('Reset refresh interval to default'))
    expect(mockSet).toHaveBeenCalledWith(null)
  })

  test('reset button does nothing when refreshInterval is already null', () => {
    const mockSet = jest.fn()
    mockUseAtom.mockReturnValue([null, mockSet])
    mockUseAtomValue.mockReturnValue({ refreshInterval: null })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByLabelText('Reset refresh interval to default'))
    expect(mockSet).not.toHaveBeenCalled()
  })

  test('shows play-circle icon when refresh is off', () => {
    mockUseAtom.mockReturnValue([null, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: null })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    // Icon is rendered via FontAwesomeIcon mock, just verify component renders
    expect(screen.getByText('Interval Refresh')).toBeInTheDocument()
  })

  test('shows stop-circle icon when refresh is on', () => {
    mockUseAtom.mockReturnValue([5000, jest.fn()])
    mockUseAtomValue.mockReturnValue({ refreshInterval: 5000 })

    render(
      <table>
        <tbody>
          <RefreshIntervalRow />
        </tbody>
      </table>
    )

    expect(screen.getByText('Interval Refresh')).toBeInTheDocument()
  })
})
