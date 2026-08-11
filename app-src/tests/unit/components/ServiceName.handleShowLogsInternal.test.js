// ServiceName.handleShowLogsInternal.test.js
// Tests for the handleShowLogsInternal function

const { handleShowLogsInternal } = require('../../../src/components/shared/names/ServiceName')

describe('handleShowLogsInternal', () => {
  const mockSetters = {
    setLogsShowLogs: jest.fn(),
    setLogsConfig: jest.fn(),
    resetLogsLines: jest.fn(),
    setFormId: jest.fn(),
    setFormName: jest.fn(),
    updateView: jest.fn(),
  }

  const callHandler = (overrides = {}) =>
    handleShowLogsInternal({
      serviceId: 'svc-123',
      serviceName: 'my-service',
      logsShowLogs: false,
      ...mockSetters,
      ...overrides,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('closes existing logs when follow is active', () => {
    callHandler({ logsShowLogs: true })

    // Should close existing logs
    expect(mockSetters.setLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetters.setLogsConfig).toHaveBeenCalledWith(null)

    // Should set form values
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-123')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('my-service')

    // Should navigate to logs view
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('closes a displayed session even when follow is not active', () => {
    // Picking another service must never leave the previous session on
    // screen: it would keep showing the previously selected service.
    callHandler({ logsShowLogs: true, serviceId: 'svc-y', serviceName: 'service-y' })

    expect(mockSetters.setLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetters.setLogsConfig).toHaveBeenCalledWith(null)
    expect(mockSetters.resetLogsLines).toHaveBeenCalled()
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-y')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('service-y')
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('works when logs are not currently showing', () => {
    callHandler({ serviceId: 'svc-456', serviceName: 'another-service' })

    // Should not try to close logs (they're not showing)
    expect(mockSetters.setLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetters.setLogsConfig).not.toHaveBeenCalled()
    expect(mockSetters.resetLogsLines).not.toHaveBeenCalled()

    // Should set form values
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-456')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('another-service')

    // Should navigate to logs view
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('navigates to logs view with correct ID', () => {
    callHandler({ serviceId: 'svc-789', serviceName: 'test-service' })

    // Check that updateView was called with a function
    expect(mockSetters.updateView).toHaveBeenCalledTimes(1)
    const updateFn = mockSetters.updateView.mock.calls[0][0]

    // The function should set id to logsId ('logs')
    const result = updateFn({ otherProp: 'value' })
    expect(result).toMatchObject({ otherProp: 'value', id: 'logs' })
  })
})
