import { renderHook, act } from '@testing-library/react'

describe('useEntityActions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('onOpen for service updates view atom', () => {
    const mockUpdateView = jest.fn()

    // prepare a safe mock of jotai that preserves real atom() and other exports
    const actualJotai = jest.requireActual('jotai')
    jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

    // require modules after mocking
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
  expect(mockUpdateView).toHaveBeenCalledWith({ id: nav.servicesDetailId, detail: 'svc1' })
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
