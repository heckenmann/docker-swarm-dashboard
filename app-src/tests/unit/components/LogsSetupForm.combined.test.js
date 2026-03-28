// Combined tests for LogsSetupForm
// Verifies that all form controls render correctly and interact properly
// with Jotai atoms for service selection, tail, since, follow, and advanced options.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  createHashAtomWithDefault: (k, d) => d,
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  logsServicesAtom: 'logsServicesAtom',
}))

jest.mock('../../../src/common/store/atoms/logsAtoms', () => ({
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
  logsShowLogsAtom: 'logsShowLogsAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  atom: (v) => v,
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../src/components/logs/SinceInput', () => ({
  __esModule: true,
  default: () => <div data-testid="since-input">SinceInput Mock</div>,
}))

jest.mock('../../../src/components/logs/logsUtils', () => ({
  isValidSince: (since) => {
    if (!since) return false
    return /^(\d+[smhd]|\d{4}-\d{2}-\d{2}T)/.test(since)
  },
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: () => {} },
}))
jest.mock('@fortawesome/free-solid-svg-icons', () => ({}))

const modLogsSetup = require('../../../src/components/logs/LogsSetupForm')
const LogsSetupForm = modLogsSetup.default

/**
 * Mount LogsSetupForm with controllable setting atoms.
 *
 * @param {object} [opts]
 * @param {Array} [opts.services=[]]
 * @param {string} [opts.serviceId='']
 * @param {string} [opts.serviceName='']
 * @param {string} [opts.tail='20']
 * @param {string} [opts.since='1h']
 * @param {boolean} [opts.follow=false]
 * @param {boolean} [opts.timestamps=false]
 * @param {boolean} [opts.stdout=true]
 * @param {boolean} [opts.stderr=true]
 * @param {boolean} [opts.details=false]
 * @param {boolean} [opts.showAdvanced=false]
 * @param {'light'|'dark'} [opts.currentVariant='light']
 */
function renderLogsSetupForm(opts = {}) {
  const {
    services = [],
    serviceId = '',
    serviceName = '',
    tail = '20',
    since = '1h',
    follow = false,
    timestamps = false,
    stdout = true,
    stderr = true,
    details = false,
    showAdvanced = false,
    currentVariant = 'light',
  } = opts

  const mockSetServiceId = jest.fn()
  const mockSetServiceName = jest.fn()
  const mockSetTail = jest.fn()
  const mockSetSince = jest.fn()
  const mockSetSinceError = jest.fn()
  const mockSetSinceAmount = jest.fn()
  const mockSetSinceUnit = jest.fn()
  const mockSetSinceIsISO = jest.fn()
  const mockSetShowAdvanced = jest.fn()
  const mockSetFollow = jest.fn()
  const mockSetTimestamps = jest.fn()
  const mockSetStdout = jest.fn()
  const mockSetStderr = jest.fn()
  const mockSetDetails = jest.fn()
  const mockSetSearchKeyword = jest.fn()
  const mockSetLogsNumberOfLines = jest.fn()
  const mockSetLogsConfig = jest.fn()
  const mockSetLogsShowLogs = jest.fn()

  mockUseAtom.mockImplementation((atom) => {
    switch (atom) {
      case 'logsFormServiceIdAtom':
        return [serviceId, mockSetServiceId]
      case 'logsFormServiceNameAtom':
        return [serviceName, mockSetServiceName]
      case 'logsFormTailAtom':
        return [tail, mockSetTail]
      case 'logsFormSinceAtom':
        return [since, mockSetSince]
      case 'logsFormSinceErrorAtom':
        return [false, mockSetSinceError]
      case 'logsFormSinceAmountAtom':
        return ['1', mockSetSinceAmount]
      case 'logsFormSinceUnitAtom':
        return ['h', mockSetSinceUnit]
      case 'logsFormSinceIsISOAtom':
        return [false, mockSetSinceIsISO]
      case 'logsFormShowAdvancedAtom':
        return [showAdvanced, mockSetShowAdvanced]
      case 'logsFormFollowAtom':
        return [follow, mockSetFollow]
      case 'logsFormTimestampsAtom':
        return [timestamps, mockSetTimestamps]
      case 'logsFormStdoutAtom':
        return [stdout, mockSetStdout]
      case 'logsFormStderrAtom':
        return [stderr, mockSetStderr]
      case 'logsFormDetailsAtom':
        return [details, mockSetDetails]
      case 'logsSearchKeywordAtom':
        return ['', mockSetSearchKeyword]
      case 'logsNumberOfLinesAtom':
        return [20, mockSetLogsNumberOfLines]
      case 'logsConfigAtom':
        return [{}, mockSetLogsConfig]
      case 'logsShowLogsAtom':
        return [false, mockSetLogsShowLogs]
      default:
        return [undefined, jest.fn()]
    }
  })

  mockUseAtomValue.mockImplementation((atom) => {
    switch (atom) {
      case 'logsServicesAtom':
        return services
      case 'currentVariantAtom':
        return currentVariant
      case 'logsNumberOfLinesAtom':
        return 20
      case 'logsMessageMaxLenAtom':
        return 10000
      case 'logsWebsocketUrlAtom':
        return null
      case 'logsFormServiceIdAtom':
        return serviceId
      case 'logsFormServiceNameAtom':
        return serviceName
      case 'logsFormTailAtom':
        return tail
      case 'logsFormSinceAtom':
        return since
      case 'logsFormSinceErrorAtom':
        return false
      case 'logsFormSinceAmountAtom':
        return '1'
      case 'logsFormSinceUnitAtom':
        return 'h'
      case 'logsFormSinceIsISOAtom':
        return false
      case 'logsFormShowAdvancedAtom':
        return showAdvanced
      case 'logsFormFollowAtom':
        return follow
      case 'logsFormTimestampsAtom':
        return timestamps
      case 'logsFormStdoutAtom':
        return stdout
      case 'logsFormStderrAtom':
        return stderr
      case 'logsFormDetailsAtom':
        return details
      case 'logsSearchKeywordAtom':
        return ''
      default:
        return undefined
    }
  })

  return render(<LogsSetupForm />)
}

describe('LogsSetupForm', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders form with default values when no service is selected', () => {
    const services = [
      { ID: 'svc-1', Name: 'test-service' },
      { ID: 'svc-2', Name: 'another-service' },
    ]

    renderLogsSetupForm({ services })

    expect(screen.getByLabelText('Search services')).toBeInTheDocument()
    expect(screen.getByLabelText('Number of lines')).toHaveValue(20)
    expect(screen.getByText('SinceInput Mock')).toBeInTheDocument()
    expect(screen.getByLabelText('Follow')).toBeInTheDocument()
    expect(screen.getByLabelText('Follow')).not.toBeChecked()
    expect(screen.getByText('Show advanced options')).toBeInTheDocument()
    expect(
      screen.getByTitle('Select a valid service first'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Number of most recent log lines/i),
    ).toBeInTheDocument()
  })

  test('renders service list when no service is selected', () => {
    const services = [
      { ID: 'svc-1', Name: 'test-service' },
      { ID: 'svc-2', Name: 'another-service' },
    ]

    renderLogsSetupForm({ services })

    const serviceList = screen.getByLabelText('Select service')
    expect(serviceList).toBeInTheDocument()
    expect(screen.getByText('test-service')).toBeInTheDocument()
    expect(screen.getByText('another-service')).toBeInTheDocument()
    expect(screen.getByText('svc-1')).toBeInTheDocument()
    expect(screen.getByText('svc-2')).toBeInTheDocument()
  })

  test('shows selected service with checkmark when service is selected', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, serviceId: 'svc-1', serviceName: 'test-service' })

    expect(screen.queryByLabelText('Select service')).not.toBeInTheDocument()
    expect(screen.getByText('test-service')).toBeInTheDocument()
    expect(screen.getByText('svc-1')).toBeInTheDocument()
    expect(screen.getByLabelText('Change service')).toBeInTheDocument()
  })

  test('filters services by search text', () => {
    const services = [
      { ID: 'svc-1', Name: 'test-service' },
      { ID: 'svc-2', Name: 'another-service' },
      { ID: 'svc-3', Name: 'web-frontend' },
    ]

    renderLogsSetupForm({ services })

    const searchInput = screen.getByLabelText('Search services')
    fireEvent.change(searchInput, { target: { value: 'web' } })

    expect(screen.getByText('web-frontend')).toBeInTheDocument()
    expect(screen.queryByText('test-service')).not.toBeInTheDocument()
  })

  test('clears service selection when search is entered after selecting a service', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['test-service', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const searchInput = screen.getByLabelText('Search services')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(mockSetServiceId).toHaveBeenCalledWith('')
    expect(mockSetServiceName).toHaveBeenCalledWith('')
  })

  test('clears service search when X button is clicked', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services })

    const searchInput = screen.getByLabelText('Search services')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const clearButton = screen.getByLabelText('Clear service search')
    fireEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
  })

  test('selects service when clicking on service list item', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()
    const mockSetServiceSearch = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', mockSetServiceSearch]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const serviceItem = screen.getByText('test-service')
    fireEvent.click(serviceItem)

    expect(mockSetServiceId).toHaveBeenCalledWith('svc-1')
    expect(mockSetServiceName).toHaveBeenCalledWith('test-service')
  })

  test('updates tail value when changed', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetTail = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', mockSetTail]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const tailInput = screen.getByLabelText('Number of lines')
    fireEvent.change(tailInput, { target: { value: '50' } })

    expect(mockSetTail).toHaveBeenCalledWith('50')
  })

  test('toggles follow checkbox', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetFollow = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, mockSetFollow]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const followCheckbox = screen.getByLabelText('Follow')
    fireEvent.click(followCheckbox)

    expect(mockSetFollow).toHaveBeenCalledWith(true)
  })

  test('shows advanced options when toggle button is clicked', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetShowAdvanced = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, mockSetShowAdvanced]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const toggleButton = screen.getByText('Show advanced options').closest('button')
    fireEvent.click(toggleButton)

    expect(mockSetShowAdvanced).toHaveBeenCalled()
  })

  test('renders advanced options when showAdvanced is true', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, showAdvanced: true })

    expect(screen.getByLabelText('Timestamps')).toBeInTheDocument()
    expect(screen.getByLabelText('Stdout')).toBeInTheDocument()
    expect(screen.getByLabelText('Stderr')).toBeInTheDocument()
    expect(screen.getByLabelText('Details')).toBeInTheDocument()
    expect(screen.getByText('Hide advanced options')).toBeInTheDocument()
  })

  test('renders advanced options with correct dark mode text styling', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, showAdvanced: true, currentVariant: 'dark' })

    // Verify Form.Text has correct dark mode class for timestamps help text
    const timestampsHelpText = screen.getByText('Include timestamps for each log line.')
    expect(timestampsHelpText).toHaveClass('text-secondary')

    // Verify Form.Text has correct dark mode class for stdout help text
    const stdoutHelpText = screen.getByText('Include standard output stream (stdout).')
    expect(stdoutHelpText).toHaveClass('text-secondary')

    // Verify Form.Text has correct dark mode class for stderr help text
    const stderrHelpText = screen.getByText('Include standard error stream (stderr).')
    expect(stderrHelpText).toHaveClass('text-secondary')

    // Verify Form.Text has correct dark mode class for details help text
    const detailsHelpText = screen.getByText(/Include additional metadata\/details/)
    expect(detailsHelpText).toHaveClass('text-secondary')
  })

  test('toggles timestamps checkbox', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetTimestamps = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [true, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, mockSetTimestamps]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const timestampsCheckbox = screen.getByLabelText('Timestamps')
    fireEvent.click(timestampsCheckbox)

    expect(mockSetTimestamps).toHaveBeenCalledWith(true)
  })

  test('toggles stdout checkbox', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetStdout = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [true, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, mockSetStdout]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const stdoutCheckbox = screen.getByLabelText('Stdout')
    fireEvent.click(stdoutCheckbox)

    expect(mockSetStdout).toHaveBeenCalledWith(false)
  })

  test('toggles stderr checkbox', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetStderr = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [true, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, mockSetStderr]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const stderrCheckbox = screen.getByLabelText('Stderr')
    fireEvent.click(stderrCheckbox)

    expect(mockSetStderr).toHaveBeenCalledWith(false)
  })

  test('toggles details checkbox', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetDetails = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [true, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, mockSetDetails]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const detailsCheckbox = screen.getByLabelText('Details')
    fireEvent.click(detailsCheckbox)

    expect(mockSetDetails).toHaveBeenCalledWith(true)
  })

  test('calls showLogs when submit button is clicked with valid service', async () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetLogsNumberOfLines = jest.fn()
    const mockSetLogsConfig = jest.fn()
    const mockSetLogsShowLogs = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['test-service', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, mockSetLogsNumberOfLines]
        case 'logsConfigAtom':
          return [{}, mockSetLogsConfig]
        case 'logsShowLogsAtom':
          return [false, mockSetLogsShowLogs]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const submitButton = screen.getByText('Show logs').closest('button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSetLogsNumberOfLines).toHaveBeenCalledWith(20)
      expect(mockSetLogsConfig).toHaveBeenCalledWith({
        serviceId: 'svc-1',
        serviceName: 'test-service',
        tail: '20',
        since: '1h',
        follow: false,
        timestamps: false,
        stdout: true,
        stderr: true,
        details: false,
      })
      expect(mockSetLogsShowLogs).toHaveBeenCalledWith(true)
    })
  })

  test('shows since error when invalid since value is entered', async () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetSinceError = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['test-service', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['invalid', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, mockSetSinceError]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const submitButton = screen.getByText('Show logs').closest('button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSetSinceError).toHaveBeenCalledWith(
        'Invalid value. Use e.g. 5m, 1h or an ISO timestamp',
      )
    })
  })

  test('clears form when clear button is clicked', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()
    const mockSetTail = jest.fn()
    const mockSetSince = jest.fn()
    const mockSetSinceError = jest.fn()
    const mockSetSinceAmount = jest.fn()
    const mockSetSinceUnit = jest.fn()
    const mockSetSinceIsISO = jest.fn()
    const mockSetFollow = jest.fn()
    const mockSetTimestamps = jest.fn()
    const mockSetStdout = jest.fn()
    const mockSetStderr = jest.fn()
    const mockSetDetails = jest.fn()
    const mockSetSearchKeyword = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['test-service', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', mockSetTail]
        case 'logsFormSinceAtom':
          return ['1h', mockSetSince]
        case 'logsFormSinceErrorAtom':
          return [false, mockSetSinceError]
        case 'logsFormSinceAmountAtom':
          return ['1', mockSetSinceAmount]
        case 'logsFormSinceUnitAtom':
          return ['h', mockSetSinceUnit]
        case 'logsFormSinceIsISOAtom':
          return [false, mockSetSinceIsISO]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, mockSetFollow]
        case 'logsFormTimestampsAtom':
          return [false, mockSetTimestamps]
        case 'logsFormStdoutAtom':
          return [true, mockSetStdout]
        case 'logsFormStderrAtom':
          return [true, mockSetStderr]
        case 'logsFormDetailsAtom':
          return [false, mockSetDetails]
        case 'logsSearchKeywordAtom':
          return ['', mockSetSearchKeyword]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const clearButton = screen.getByLabelText('Clear form')
    fireEvent.click(clearButton)

    expect(mockSetServiceId).toHaveBeenCalledWith('')
    expect(mockSetServiceName).toHaveBeenCalledWith('')
    expect(mockSetTail).toHaveBeenCalledWith('20')
    expect(mockSetSince).toHaveBeenCalledWith('1h')
    expect(mockSetSinceError).toHaveBeenCalledWith(false)
    expect(mockSetSinceAmount).toHaveBeenCalledWith('1')
    expect(mockSetSinceUnit).toHaveBeenCalledWith('h')
    expect(mockSetSinceIsISO).toHaveBeenCalledWith(false)
    expect(mockSetFollow).toHaveBeenCalledWith(false)
    expect(mockSetTimestamps).toHaveBeenCalledWith(false)
    expect(mockSetStdout).toHaveBeenCalledWith(true)
    expect(mockSetStderr).toHaveBeenCalledWith(true)
    expect(mockSetDetails).toHaveBeenCalledWith(false)
    expect(mockSetSearchKeyword).toHaveBeenCalledWith('')
  })

  test('disables submit button when no service is selected', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, serviceId: '' })

    const submitButton = screen.getByText('Show logs').closest('button')
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveAttribute('aria-disabled', 'true')
  })

  test('enables submit button when service is selected', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, serviceId: 'svc-1', serviceName: 'test-service' })

    const submitButton = screen.getByText('Show logs').closest('button')
    expect(submitButton).not.toBeDisabled()
    expect(submitButton).toHaveAttribute('aria-disabled', 'false')
  })

  test('renders with dark variant styling', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, serviceId: 'svc-1', serviceName: 'test-service', currentVariant: 'dark' })

    const selectedServiceDiv = screen.getByLabelText('Change service')
    expect(selectedServiceDiv).toHaveClass('border-secondary')
    expect(selectedServiceDiv).toHaveClass('text-secondary')
  })

  test('renders with light variant styling', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services, serviceId: 'svc-1', serviceName: 'test-service', currentVariant: 'light' })

    const selectedServiceDiv = screen.getByLabelText('Change service')
    expect(selectedServiceDiv).toHaveClass('border-secondary-subtle')
    expect(selectedServiceDiv).toHaveClass('text-muted')
  })

  test('shows empty state when no services are available', () => {
    renderLogsSetupForm({ services: [] })

    expect(screen.getByText('No services available')).toBeInTheDocument()
  })

  test('shows no results message when search does not match any service', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]

    renderLogsSetupForm({ services })

    const searchInput = screen.getByLabelText('Search services')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    expect(
      screen.getByText(/No services match/i),
    ).toBeInTheDocument()
  })

  test('keeps selected service in filtered list when searching', () => {
    const services = [
      { ID: 'svc-1', Name: 'test-service' },
      { ID: 'svc-2', Name: 'another-service' },
    ]

    renderLogsSetupForm({ services, serviceId: 'svc-1', serviceName: 'test-service' })

    const searchInput = screen.getByLabelText('Search services')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(screen.getByText('test-service')).toBeInTheDocument()
  })

  test('submits form with Enter key in since input', async () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetLogsNumberOfLines = jest.fn()
    const mockSetLogsConfig = jest.fn()
    const mockSetLogsShowLogs = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', jest.fn()]
        case 'logsFormServiceNameAtom':
          return ['test-service', jest.fn()]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, mockSetLogsNumberOfLines]
        case 'logsConfigAtom':
          return [{}, mockSetLogsConfig]
        case 'logsShowLogsAtom':
          return [false, mockSetLogsShowLogs]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const form = screen.getByLabelText('Search services').closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSetLogsShowLogs).toHaveBeenCalledWith(true)
    })
  })

  test('changes service when clicking on selected service display', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['test-service', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const selectedServiceDiv = screen.getByLabelText('Change service')
    fireEvent.click(selectedServiceDiv)

    expect(mockSetServiceId).toHaveBeenCalledWith('')
    expect(mockSetServiceName).toHaveBeenCalledWith('')
  })

  test('changes service when pressing Enter on selected service display', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['test-service', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const selectedServiceDiv = screen.getByLabelText('Change service')
    fireEvent.keyDown(selectedServiceDiv, { key: 'Enter' })

    expect(mockSetServiceId).toHaveBeenCalledWith('')
    expect(mockSetServiceName).toHaveBeenCalledWith('')
  })

  test('changes service when pressing Space on selected service display', () => {
    const services = [{ ID: 'svc-1', Name: 'test-service' }]
    const mockSetServiceId = jest.fn()
    const mockSetServiceName = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'logsFormServiceIdAtom':
          return ['svc-1', mockSetServiceId]
        case 'logsFormServiceNameAtom':
          return ['test-service', mockSetServiceName]
        case 'logsFormTailAtom':
          return ['20', jest.fn()]
        case 'logsFormSinceAtom':
          return ['1h', jest.fn()]
        case 'logsFormSinceErrorAtom':
          return [false, jest.fn()]
        case 'logsFormSinceAmountAtom':
          return ['1', jest.fn()]
        case 'logsFormSinceUnitAtom':
          return ['h', jest.fn()]
        case 'logsFormSinceIsISOAtom':
          return [false, jest.fn()]
        case 'logsFormShowAdvancedAtom':
          return [false, jest.fn()]
        case 'logsFormFollowAtom':
          return [false, jest.fn()]
        case 'logsFormTimestampsAtom':
          return [false, jest.fn()]
        case 'logsFormStdoutAtom':
          return [true, jest.fn()]
        case 'logsFormStderrAtom':
          return [true, jest.fn()]
        case 'logsFormDetailsAtom':
          return [false, jest.fn()]
        case 'logsSearchKeywordAtom':
          return ['', jest.fn()]
        case 'logsNumberOfLinesAtom':
          return [20, jest.fn()]
        case 'logsConfigAtom':
          return [{}, jest.fn()]
        case 'logsShowLogsAtom':
          return [false, jest.fn()]
        default:
          return [undefined, jest.fn()]
      }
    })

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'logsServicesAtom':
          return services
        case 'currentVariantAtom':
          return 'light'
        default:
          return undefined
      }
    })

    render(<LogsSetupForm />)

    const selectedServiceDiv = screen.getByLabelText('Change service')
    fireEvent.keyDown(selectedServiceDiv, { key: ' ' })

    expect(mockSetServiceId).toHaveBeenCalledWith('')
    expect(mockSetServiceName).toHaveBeenCalledWith('')
  })
})
