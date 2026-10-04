const { spawnSync } = require('node:child_process')
const { discover, createMatrix } = require('./shard-cypress-specs.cjs')

/** Run one shard with shell-free arguments and inherited output.
 * @returns {Promise<void>} Resolves after Cypress exits.
 */
async function main() {
  const matrix = createMatrix(await discover(), process.env.CYPRESS_SHARDS || 4)
  const assignment = process.env.CYPRESS_ASSIGNMENT
    ? JSON.parse(process.env.CYPRESS_ASSIGNMENT)
    : matrix.include.find(
        (entry) =>
          entry.runner === 'ubuntu-24.04' &&
          entry.browser === (process.env.CYPRESS_BROWSER || 'electron') &&
          entry.shard === Number(process.argv[2] || 1),
      )
  if (
    !assignment ||
    !matrix.include.some(
      (entry) =>
        ['runner', 'browser', 'shard', 'shardCount'].every(
          (key) => entry[key] === assignment[key],
        ) && JSON.stringify(entry.specs) === JSON.stringify(assignment.specs),
    )
  )
    throw new Error('Invalid shard assignment')
  const result = spawnSync(
    'yarn',
    [
      'run',
      'cy:run',
      '--browser',
      assignment.browser,
      '--spec',
      assignment.specs.join(','),
    ],
    {
      stdio: 'inherit',
      env: { ...process.env, CYPRESS_ASSIGNMENT: JSON.stringify(assignment) },
    },
  )
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
module.exports = { main }
