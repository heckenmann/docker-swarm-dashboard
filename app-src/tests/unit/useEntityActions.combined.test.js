// Combined useEntityActions tests (self-contained)
const { renderHook, act } = require('@testing-library/react')

describe('useEntityActions core', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('onOpen for service updates view atom', () => {
    const mockUpdateView = jest.fn()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))
  const atoms = require('../../src/common/store/atoms')
    const jotai = require('jotai')
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
      return [null, jest.fn()]
    })
  const nav = require('../../src/common/navigationConstants')
  const { useEntityActions } = require('../../src/common/actions/entityActions')
    const { result } = renderHook(() => useEntityActions('service'))
    act(() => result.current.onOpen('svc1'))
    expect(mockUpdateView).toHaveBeenCalled()
    const updater = mockUpdateView.mock.calls[0][0]
    expect(typeof updater).toBe('function')
    expect(updater({})).toEqual({ id: nav.servicesDetailId, detail: 'svc1' })
  })

  test('onFilter for stack sets filter type and stack name', () => {
    const mockSetStack = jest.fn()
    const mockSetFilterType = jest.fn()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))
  const atoms = require('../../src/common/store/atoms')
    const jotai = require('jotai')
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, jest.fn()]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', mockSetStack]
      if (atom === atoms.filterTypeAtom) return ['service', mockSetFilterType]
      return [null, jest.fn()]
    })
  const { useEntityActions } = require('../../src/common/actions/entityActions')
    const { result } = renderHook(() => useEntityActions('stack'))
    act(() => result.current.onFilter('mystack'))
    expect(mockSetFilterType).toHaveBeenCalledWith('stack')
    expect(mockSetStack).toHaveBeenCalledWith('mystack')
  })
})

describe('useEntityActions extra behaviors', () => {
  beforeEach(() => {
    const _useAtom = jest.requireActual('jotai').useAtom
    jest.doMock('jotai', () => ({ ...jest.requireActual('jotai'), useAtom: jest.fn() }))
  })

  test('onOpen navigates to nodes detail when entityType=node', () => {
  const entityActions = require('../../src/common/actions/entityActions')
    const updateView = jest.fn()
    const useAtomMock = require('jotai').useAtom
    useAtomMock
      .mockReturnValueOnce([null, updateView])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
    const { result } = renderHook(() => entityActions.useEntityActions('node'))
    act(() => result.current.onOpen('nid'))
    expect(updateView).toHaveBeenCalled()
    const updater = updateView.mock.calls[0][0]
    expect(typeof updater).toBe('function')
  // ensure updater returns correct shape
  const nav = require('../../src/common/navigationConstants')
  expect(updater({})).toEqual({ id: nav.nodesDetailId, detail: 'nid' })
  })

  test('onOpen navigates to tasks detail when entityType=task', () => {
    const updateView = jest.fn()
    const useAtomMock = require('jotai').useAtom
    useAtomMock
      .mockReturnValueOnce([null, updateView])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
    const { result } = renderHook(() => require('../../src/common/actions/entityActions').useEntityActions('task'))
    act(() => result.current.onOpen('tid'))
    expect(updateView).toHaveBeenCalled()
    const updater = updateView.mock.calls[0][0]
    expect(typeof updater).toBe('function')
  const nav = require('../../src/common/navigationConstants')
  expect(updater({})).toEqual({ id: nav.tasksId, detail: 'tid' })
  })

  test('onOpen does nothing when no id provided', () => {
    const updateView = jest.fn()
    const useAtomMock = require('jotai').useAtom
    useAtomMock
      .mockReturnValueOnce([null, updateView])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, jest.fn()])
  const { result } = renderHook(() => require('../../src/common/actions/entityActions').useEntityActions('service'))
    act(() => result.current.onOpen(null))
    expect(updateView).not.toHaveBeenCalled()
  })

  test('onFilter sets service filter and clears stack filter', () => {
    const setServiceFilterName = jest.fn()
    const setStackFilterName = jest.fn()
    const setFilterType = jest.fn()
    const useAtomMock = require('jotai').useAtom
    useAtomMock
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, setServiceFilterName])
      .mockReturnValueOnce([null, setStackFilterName])
      .mockReturnValueOnce([null, setFilterType])
  const { result } = renderHook(() => require('../../src/common/actions/entityActions').useEntityActions('service'))
    act(() => result.current.onFilter('svcA'))
    expect(setFilterType).toHaveBeenCalledWith('service')
    expect(setServiceFilterName).toHaveBeenCalledWith('svcA')
    expect(setStackFilterName).toHaveBeenCalledWith('')
  })

  test('onFilter sets stack filter and clears service filter', () => {
    const setServiceFilterName = jest.fn()
    const setStackFilterName = jest.fn()
    const setFilterType = jest.fn()
    const useAtomMock = require('jotai').useAtom
    useAtomMock
      .mockReturnValueOnce([null, jest.fn()])
      .mockReturnValueOnce([null, setServiceFilterName])
      .mockReturnValueOnce([null, setStackFilterName])
      .mockReturnValueOnce([null, setFilterType])
  const { result } = renderHook(() => require('../../src/common/actions/entityActions').useEntityActions('stack'))
    act(() => result.current.onFilter('stackA'))
    expect(setFilterType).toHaveBeenCalledWith('stack')
    expect(setStackFilterName).toHaveBeenCalledWith('stackA')
    expect(setServiceFilterName).toHaveBeenCalledWith('')
  })

  test('onOpen and onFilter no-ops for falsy inputs', () => {
    const mockUpdateView = jest.fn()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))
  const atoms = require('../../src/common/store/atoms')
    const jotai = require('jotai')
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
      return [null, jest.fn()]
    })
  const { useEntityActions } = require('../../src/common/actions/entityActions')
    const { result } = renderHook(() => useEntityActions('service'))
    act(() => result.current.onOpen(''))
    act(() => result.current.onFilter(''))
    expect(mockUpdateView).not.toHaveBeenCalled()
  })

  test('onOpen does not call updateView for unknown entityType', () => {
    const mockUpdateView = jest.fn()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))
    const atoms = require('../../src/common/store/atoms')
    const jotai = require('jotai')
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
      return [null, jest.fn()]
    })
    const { useEntityActions } = require('../../src/common/actions/entityActions')
    const { result } = renderHook(() => useEntityActions('unknown'))
    act(() => result.current.onOpen('x'))
    expect(mockUpdateView).not.toHaveBeenCalled()
  })

  test('onOpen for service produces updater that sets servicesDetailId', () => {
    const mockUpdateView = jest.fn()
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))
    const atoms = require('../../src/common/store/atoms')
    const jotai = require('jotai')
    jotai.useAtom.mockImplementation((atom) => {
      if (atom === atoms.viewAtom) return [null, mockUpdateView]
      if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
      if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
      return [null, jest.fn()]
    })
    const nav = require('../../src/common/navigationConstants')
    const { useEntityActions } = require('../../src/common/actions/entityActions')
    const { result } = renderHook(() => useEntityActions('service'))
    act(() => result.current.onOpen('svcX'))
    expect(mockUpdateView).toHaveBeenCalled()
    const updater = mockUpdateView.mock.calls[0][0]
    expect(typeof updater).toBe('function')
    expect(updater({})).toEqual({ id: nav.servicesDetailId, detail: 'svcX' })
  })
})
