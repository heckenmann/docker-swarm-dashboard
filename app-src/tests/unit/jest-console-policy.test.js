/** @jest-environment node */
const path = require('node:path')
const { spawnSync } = require('node:child_process')

test.each(['error', 'warn'])(
  'unexpected console.%s fails a real Jest process',
  (method) => {
    const fixture = path.resolve(__dirname, '../fixtures/jest-console')
    const execute = (expected) =>
      spawnSync(
        process.execPath,
        [
          require.resolve('jest/bin/jest'),
          '--config',
          path.resolve(__dirname, '../../jest.config.cjs'),
          '--roots',
          fixture,
          '--testMatch',
          '**/*.test.cjs',
          '--runInBand',
          '--no-coverage',
        ],
        {
          cwd: path.resolve(__dirname, '../..'),
          encoding: 'utf8',
          env: {
            ...process.env,
            CONSOLE_PROBE_METHOD: method,
            CONSOLE_PROBE_EXPECTED: String(expected),
          },
        },
      )
    const unexpected = execute(false)
    expect(unexpected.error).toBeUndefined()
    expect(unexpected.status).toBe(1)
    expect(unexpected.stderr).toContain(`console.${method}()`)
    expect(unexpected.stderr).toContain('unexpected diagnostic')
    const expected = execute(true)
    expect(expected.error).toBeUndefined()
    expect(expected.status).toBe(0)
    expect(expected.stderr).not.toContain('unexpected diagnostic')
  },
  30000,
)
