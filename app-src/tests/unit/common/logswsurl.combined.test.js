// Combined logs websocket URL tests (self-contained)
jest.mock('jotai', () => ({ atom: (v) => v }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))
jest.mock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

describe('logsWebsocketUrlAtom', () => {
	afterEach(() => jest.resetModules())

	test('constructs ws url from absolute baseUrl', () => {
		const atoms = require('../../../src/common/store/atoms')
		const get = (req) => {
			if (req === atoms.logsConfigAtom) return { serviceId: 's1', tail: '10', since: '0', follow: 'true', timestamps: 'false', stdout: 'true', stderr: 'false', details: 'false' }
			if (req === atoms.baseUrlAtom) return 'https://example.com/base/'
			if (req === atoms.isDarkModeAtom) return false
			return null
		}
		const url = atoms.logsWebsocketUrlAtom(get)
		expect(url).toMatch(/^wss:\/\/example.com\/base\/docker\/logs\/s1\?/) // basic shape
	})

	test('constructs ws url from relative baseUrl', () => {
		const atoms = require('../../../src/common/store/atoms')
		const get = (req) => {
			if (req === atoms.logsConfigAtom) return { serviceId: 's2', tail: '5', since: '0', follow: 'false', timestamps: 'true', stdout: 'true', stderr: 'true', details: 'false' }
			if (req === atoms.baseUrlAtom) return '/app/'
			// provide a window location surrogate
			global.window = Object.create(window)
			global.window.location = { protocol: 'http:', host: 'localhost', pathname: '/' }
			return null
		}
		const url = atoms.logsWebsocketUrlAtom(get)
		expect(url).toMatch(/^ws:\/\/localhost\/app\/docker\/logs\/s2\?/) // basic shape
	})
})

// Extra branches
jest.mock('jotai', () => ({ atom: (v) => v, useAtom: () => [] }))
jest.mock('jotai/utils', () => ({ atomWithReducer: (v) => v, atomWithReset: (v) => v, selectAtom: (a) => a }))

const { logsWebsocketUrlAtom, logsConfigAtom, baseUrlAtom } = require('../../../src/common/store/atoms')

describe('logsWebsocketUrlAtom extra branches', () => {
	test('returns null when logsConfig is falsy', () => {
		const get = (a) => null
		const result = logsWebsocketUrlAtom(get)
		expect(result).toBeNull()
	})

	test('builds ws url for relative base path', () => {
		const fakeConfig = { serviceId: 'svc1', tail: '10', since: '0', follow: 'true', timestamps: 'true', stdout: '1', stderr: '0', details: '1' }
		const get = (a) => {
			if (a === logsConfigAtom) return fakeConfig
			if (a === baseUrlAtom) return '/my/base'
			return null
		}
		// Provide window globals expected by the atom when relative baseUrl
		global.window = { location: { protocol: 'http:', host: 'example.com' } }
		const url = logsWebsocketUrlAtom(get)
		// host may vary in the test runner environment; assert ws scheme and path
		expect(url).toContain('ws://')
		expect(url).toContain('/my/base/docker/logs/svc1')
	})

	test('builds ws url for absolute base url', () => {
		const fakeConfig = { serviceId: 'svc2', tail: '5', since: '1', follow: 'false', timestamps: 'false', stdout: '1', stderr: '1', details: '0' }
		const get = (a) => {
			if (a === logsConfigAtom) return fakeConfig
			if (a === baseUrlAtom) return 'http://downstream.example/path'
			return null
		}
		const url = logsWebsocketUrlAtom(get)
		expect(url).toContain('ws://downstream.example')
		expect(url).toContain('/path/docker/logs/svc2')
	})
})
