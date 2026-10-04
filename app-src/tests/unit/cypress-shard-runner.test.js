/** @jest-environment node */
jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }))
jest.mock('../../scripts/shard-cypress-specs.cjs', () => ({
  discover: jest.fn().mockResolvedValue(['cypress/e2e/example.cy.js']),
  createMatrix: jest.requireActual('../../scripts/shard-cypress-specs.cjs')
    .createMatrix,
}))
const { spawnSync } = require('node:child_process')
const { main } = require('../../scripts/run-cypress-shard.cjs')
const { createMatrix } = require('../../scripts/shard-cypress-specs.cjs')

let previousEnv
let previousArgv
let previousExit
beforeEach(() => {
  previousEnv = process.env
  previousArgv = process.argv
  previousExit = process.exitCode
  process.env = { ...process.env }
  delete process.env.CYPRESS_ASSIGNMENT
  delete process.env.CYPRESS_SHARDS
  delete process.env.CYPRESS_BROWSER
  process.argv = ['node', 'runner']
  spawnSync.mockReset().mockReturnValue({ status: 0 })
})
afterEach(() => {
  process.env = previousEnv
  process.argv = previousArgv
  process.exitCode = previousExit
})
test('runs local shard with argument array and inherited output', async () => {
  await main()
  expect(spawnSync).toHaveBeenCalledWith(
    'yarn',
    [
      'run',
      'cy:run',
      '--browser',
      'electron',
      '--spec',
      'cypress/e2e/example.cy.js',
    ],
    expect.objectContaining({ stdio: 'inherit' }),
  )
  expect(spawnSync.mock.calls[0][2].shell).toBeUndefined()
  expect(process.exitCode).toBe(0)
})
test('accepts CI assignment independently of JSON property order', async () => {
  const entry = createMatrix(['cypress/e2e/example.cy.js']).include[0]
  process.env.CYPRESS_ASSIGNMENT = JSON.stringify(
    Object.fromEntries(Object.entries(entry).reverse()),
  )
  spawnSync.mockReturnValue({ status: 7 })
  await main()
  expect(process.exitCode).toBe(7)
})
test('rejects empty or foreign assignments before spawning', async () => {
  process.env.CYPRESS_ASSIGNMENT = '{}'
  await expect(main()).rejects.toThrow('Invalid shard assignment')
  delete process.env.CYPRESS_ASSIGNMENT
  process.argv.push('99')
  await expect(main()).rejects.toThrow('Invalid shard assignment')
  expect(spawnSync).not.toHaveBeenCalled()
})
test('handles signals and spawn failures as failures', async () => {
  spawnSync.mockReturnValue({ status: null })
  await main()
  expect(process.exitCode).toBe(1)
  spawnSync.mockReturnValue({ error: new Error('spawn failure') })
  await expect(main()).rejects.toThrow('spawn failure')
})
