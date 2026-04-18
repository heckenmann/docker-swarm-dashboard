// ServiceName.handleShowLogsInternal.test.js
// Tests for the handleShowLogsInternal function

const { handleShowLogsInternal } = require('../../../src/components/shared/names/ServiceName')

describe('handleShowLogsInternal', () => {
  const mockSetters = {
    setLogsShowLogs: jest.fn(),
    setLogsConfig: jest.fn(),
    setFormId: jest.fn(),
    setFormName: jest.fn(),
    updateView: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('closes existing logs when follow is active', () => {
    handleShowLogsInternal(
      'svc-123',
      'my-service',
      true, // logsShowLogsVal - logs currently showing
      { follow: true }, // logsConfigVal - follow mode active
      mockSetters.setLogsShowLogs,
      mockSetters.setLogsConfig,
      mockSetters.setFormId,
      mockSetters.setFormName,
      mockSetters.updateView,
    )

    // Should close existing logs
    expect(mockSetters.setLogsShowLogs).toHaveBeenCalledWith(false)
    expect(mockSetters.setLogsConfig).toHaveBeenCalledWith(null)
    
    // Should set form values
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-123')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('my-service')
    
    // Should navigate to logs view
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('does not close logs when follow is not active', () => {
    handleShowLogsInternal(
      'svc-123',
      'my-service',
      true, // logsShowLogsVal - logs currently showing
      { follow: false }, // logsConfigVal - follow mode NOT active
      mockSetters.setLogsShowLogs,
      mockSetters.setLogsConfig,
      mockSetters.setFormId,
      mockSetters.setFormName,
      mockSetters.updateView,
    )

    // Should NOT close logs (follow is not active)
    expect(mockSetters.setLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetters.setLogsConfig).not.toHaveBeenCalled()
    
    // Should still set form values
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-123')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('my-service')
    
    // Should navigate to logs view
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('works when logs are not currently showing', () => {
    handleShowLogsInternal(
      'svc-456',
      'another-service',
      false, // logsShowLogsVal - logs NOT showing
      null, // logsConfigVal - no config
      mockSetters.setLogsShowLogs,
      mockSetters.setLogsConfig,
      mockSetters.setFormId,
      mockSetters.setFormName,
      mockSetters.updateView,
    )

    // Should not try to close logs (they're not showing)
    expect(mockSetters.setLogsShowLogs).not.toHaveBeenCalled()
    expect(mockSetters.setLogsConfig).not.toHaveBeenCalled()
    
    // Should set form values
    expect(mockSetters.setFormId).toHaveBeenCalledWith('svc-456')
    expect(mockSetters.setFormName).toHaveBeenCalledWith('another-service')
    
    // Should navigate to logs view
    expect(mockSetters.updateView).toHaveBeenCalled()
  })

  test('navigates to logs view with correct ID', () => {
    handleShowLogsInternal(
      'svc-789',
      'test-service',
      false,
      null,
      mockSetters.setLogsShowLogs,
      mockSetters.setLogsConfig,
      mockSetters.setFormId,
      mockSetters.setFormName,
      mockSetters.updateView,
    )

    // Check that updateView was called with a function
    expect(mockSetters.updateView).toHaveBeenCalledTimes(1)
    const updateFn = mockSetters.updateView.mock.calls[0][0]
    
    // The function should set id to logsId ('logs')
    const result = updateFn({ otherProp: 'value' })
    expect(result).toMatchObject({ otherProp: 'value', id: 'logs' })
  })
})
