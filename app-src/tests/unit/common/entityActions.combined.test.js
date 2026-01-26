// Combined entityActions tests (self-contained)
const { renderHook, act } = require('@testing-library/react')

describe('useEntityActions branches', () => {
	beforeEach(() => {
		jest.resetAllMocks()
		jest.resetModules()
	})

	test('no-op onOpen when id falsy and no-op onFilter when empty', () => {
		const mockUpdateView = jest.fn()
		const actualJotai = jest.requireActual('jotai')
		jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

		const atoms = require('../../../src/common/store/atoms')
		const jotai = require('jotai')
		jotai.useAtom.mockImplementation((atom) => {
			if (atom === atoms.viewAtom) return [null, mockUpdateView]
			if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
			if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
			if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
			return [null, jest.fn()]
		})

		const { useEntityActions } = require('../../../src/common/actions/entityActions')
		const { result } = renderHook(() => useEntityActions('service'))
		act(() => result.current.onOpen(''))
		act(() => result.current.onFilter(''))
		expect(mockUpdateView).not.toHaveBeenCalled()
	})

	test('node and task onOpen call updater', () => {
		const mockUpdateView = jest.fn()
		const actualJotai = jest.requireActual('jotai')
		jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

		const atoms = require('../../../src/common/store/atoms')
		const jotai = require('jotai')
		jotai.useAtom.mockImplementation((atom) => {
			if (atom === atoms.viewAtom) return [null, mockUpdateView]
			if (atom === atoms.serviceNameFilterAtom) return ['', jest.fn()]
			if (atom === atoms.stackNameFilterAtom) return ['', jest.fn()]
			if (atom === atoms.filterTypeAtom) return ['service', jest.fn()]
			return [null, jest.fn()]
		})

		const { useEntityActions } = require('../../../src/common/actions/entityActions')
		const nav = require('../../../src/common/navigationConstants')

		// node
		const { result: nodeRes } = renderHook(() => useEntityActions('node'))
		act(() => nodeRes.current.onOpen('n1'))
		expect(mockUpdateView).toHaveBeenCalled()
		let updater = mockUpdateView.mock.calls.pop()[0]
		expect(updater({})).toEqual({ id: nav.nodesDetailId, detail: 'n1' })

		// task
		const { result: taskRes } = renderHook(() => useEntityActions('task'))
		act(() => taskRes.current.onOpen('t1'))
		expect(mockUpdateView).toHaveBeenCalled()
		updater = mockUpdateView.mock.calls.pop()[0]
		expect(updater({})).toEqual({ id: nav.tasksId, detail: 't1' })
	})

	test('stack filter sets types and clears service filter', () => {
		const mockSetStack = jest.fn()
		const mockSetService = jest.fn()
		const mockSetFilterType = jest.fn()

		const actualJotai = jest.requireActual('jotai')
		jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

		const atoms = require('../../../src/common/store/atoms')
		const jotai = require('jotai')
		jotai.useAtom.mockImplementation((atom) => {
			if (atom === atoms.viewAtom) return [null, jest.fn()]
			if (atom === atoms.serviceNameFilterAtom) return ['', mockSetService]
			if (atom === atoms.stackNameFilterAtom) return ['', mockSetStack]
			if (atom === atoms.filterTypeAtom) return ['service', mockSetFilterType]
			return [null, jest.fn()]
		})

		const { useEntityActions } = require('../../../src/common/actions/entityActions')
		const { result } = renderHook(() => useEntityActions('stack'))
		act(() => result.current.onFilter('mystack'))
		expect(mockSetFilterType).toHaveBeenCalledWith('stack')
		expect(mockSetStack).toHaveBeenCalledWith('mystack')
		expect(mockSetService).toHaveBeenCalledWith('')
	})

	test('service onOpen and onFilter clear stack filter branch', () => {
		const mockUpdateView = jest.fn()
		const mockSetService = jest.fn()
		const mockSetStack = jest.fn()
		const mockSetFilterType = jest.fn()

		const actualJotai = jest.requireActual('jotai')
		jest.doMock('jotai', () => ({ ...actualJotai, useAtom: jest.fn() }))

		const atoms = require('../../../src/common/store/atoms')
		const jotai = require('jotai')
		jotai.useAtom.mockImplementation((atom) => {
			if (atom === atoms.viewAtom) return [null, mockUpdateView]
			if (atom === atoms.serviceNameFilterAtom) return ['', mockSetService]
			if (atom === atoms.stackNameFilterAtom) return ['', mockSetStack]
			if (atom === atoms.filterTypeAtom) return ['stack', mockSetFilterType]
			return [null, jest.fn()]
		})

		const { useEntityActions } = require('../../../src/common/actions/entityActions')
		const { result } = renderHook(() => useEntityActions('service'))
		// service onOpen should call updateView updater
		act(() => result.current.onOpen('svc1'))
		expect(mockUpdateView).toHaveBeenCalled()
		// service onFilter should set service filter and clear stack filter
		act(() => result.current.onFilter('mysvc'))
		expect(mockSetFilterType).toHaveBeenCalledWith('service')
		expect(mockSetService).toHaveBeenCalledWith('mysvc')
		expect(mockSetStack).toHaveBeenCalledWith('')
	})
})
