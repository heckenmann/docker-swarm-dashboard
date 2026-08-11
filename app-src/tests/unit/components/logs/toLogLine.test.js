import { toLogLine } from '../../../../src/components/logs/logsUtils'

describe('toLogLine', () => {
  test('passes strings through unchanged', () => {
    expect(toLogLine('hello world', 10000)).toBe('hello world')
  })

  test('truncates messages beyond the maximum length', () => {
    expect(toLogLine('abcdefghij', 4)).toBe('abcd...')
  })

  test('falls back to 10000 characters for an unusable maximum', () => {
    const long = 'x'.repeat(10050)
    expect(toLogLine(long, 'not-a-number')).toBe('x'.repeat(10000) + '...')
  })

  test('serializes non-string payloads', () => {
    expect(toLogLine({ msg: 'hi' }, 10000)).toBe('{"msg":"hi"}')
  })

  test('stringifies payloads that cannot be serialized', () => {
    const circular = {}
    circular.self = circular
    expect(toLogLine(circular, 10000)).toBe('[object Object]')
  })
})
