// Regression tests for picking a service in the logs setup form.
// The list items are rendered inside a <form>: as bare <button> elements they
// defaulted to type="submit", so selecting a service submitted the form and
// started a session for the previously selected service.
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
}))

jest.mock('../../../../src/common/store/atoms/dashboardAtoms', () => ({
  logsServicesAtom: 'logsServicesAtom',
}))

jest.mock('../../../../src/common/store/atoms/logsAtoms', () => ({
  logsFormServiceIdAtom: 'logsFormServiceIdAtom',
  logsFormServiceNameAtom: 'logsFormServiceNameAtom',
  logsFormTailAtom: 'logsFormTailAtom',
  logsFormSinceAtom: 'logsFormSinceAtom',
  logsFormSinceErrorAtom: 'logsFormSinceErrorAtom',
  logsFormSinceAmountAtom: 'logsFormSinceAmountAtom',
  logsFormSinceUnitAtom: 'logsFormSinceUnitAtom',
  logsFormSinceIsISOAtom: 'logsFormSinceIsISOAtom',
  logsFormShowAdvancedAtom: 'logsFormShowAdvancedAtom',
  logsFormFollowAtom: 'logsFormFollowAtom',
  logsFormTimestampsAtom: 'logsFormTimestampsAtom',
  logsFormStdoutAtom: 'logsFormStdoutAtom',
  logsFormStderrAtom: 'logsFormStderrAtom',
  logsFormDetailsAtom: 'logsFormDetailsAtom',
  logsSearchKeywordAtom: 'logsSearchKeywordAtom',
  logsNumberOfLinesAtom: 'logsNumberOfLinesAtom',
  logsConfigAtom: 'logsConfigAtom',
  logsErrorAtom: 'logsErrorAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  atom: (v) => v,
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../../src/components/logs/SinceInput', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

import LogsSetupForm from '../../../../src/components/logs/LogsSetupForm'

const services = [
  { ID: 'svc-x', Name: 'service-x' },
  { ID: 'svc-y', Name: 'service-y' },
]

const setters = {
  setServiceId: jest.fn(),
  setServiceName: jest.fn(),
  setLogsConfig: jest.fn(),
  setLogsShowLogs: jest.fn(),
}

/** Renders the form with `serviceId` already selected. */
function renderForm(serviceId = '', serviceName = '') {
  const values = {
    logsFormServiceIdAtom: serviceId,
    logsFormServiceNameAtom: serviceName,
    logsFormTailAtom: '20',
    logsFormSinceAtom: '1h',
    logsFormSinceErrorAtom: false,
    logsFormSinceAmountAtom: '1',
    logsFormSinceUnitAtom: 'h',
    logsFormSinceIsISOAtom: false,
    logsFormShowAdvancedAtom: false,
    logsFormFollowAtom: false,
    logsFormTimestampsAtom: false,
    logsFormStdoutAtom: true,
    logsFormStderrAtom: true,
    logsFormDetailsAtom: false,
    logsSearchKeywordAtom: '',
    logsNumberOfLinesAtom: 20,
    logsConfigAtom: null,
    logsErrorAtom: null,
    logsShowLogsAtom: false,
  }
  mockUseAtom.mockImplementation((atom) => {
    switch (atom) {
      case 'logsFormServiceIdAtom':
        return [serviceId, setters.setServiceId]
      case 'logsFormServiceNameAtom':
        return [serviceName, setters.setServiceName]
      case 'logsConfigAtom':
        return [null, setters.setLogsConfig]
      case 'logsShowLogsAtom':
        return [false, setters.setLogsShowLogs]
      default:
        return [values[atom], jest.fn()]
    }
  })
  mockUseAtomValue.mockImplementation((atom) =>
    atom === 'logsServicesAtom'
      ? services
      : atom === 'currentVariantAtom'
        ? 'light'
        : values[atom],
  )
  return render(<LogsSetupForm />)
}

describe('LogsSetupForm service selection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('service list items are plain buttons, not form submitters', () => {
    renderForm()

    for (const name of ['service-x', 'service-y']) {
      expect(screen.getByText(name).closest('button')).toHaveAttribute(
        'type',
        'button',
      )
    }
  })

  test('picking a service selects it without starting a session', () => {
    // A previously selected service (X) is what a submit would have streamed.
    renderForm('svc-x', 'service-x')

    // Reopen the list, then pick the other service.
    fireEvent.click(screen.getByLabelText('Change service'))
    renderForm()
    fireEvent.click(screen.getAllByText('service-y')[0])

    expect(setters.setServiceId).toHaveBeenCalledWith('svc-y')
    expect(setters.setServiceName).toHaveBeenCalledWith('service-y')
    expect(setters.setLogsShowLogs).not.toHaveBeenCalled()
    expect(setters.setLogsConfig).not.toHaveBeenCalled()
  })
})
