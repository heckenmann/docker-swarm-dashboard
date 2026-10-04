const fs = require('node:fs/promises')
const { appendFileSync } = require('node:fs')
const { discover, createMatrix } = require('./shard-cypress-specs.cjs')
const { validateReport } = require('./cypress-shard-report.cjs')

/** Validate job conclusions and all expected shard reports.
 * @param {object} matrix Expected matrix.
 * @param {object[]} reports Collected reports.
 * @param {object} conclusions Dependency job conclusions.
 * @returns {string} Markdown timing summary.
 */
function checkReports(matrix, reports, conclusions) {
  if (
    ['discover', 'prep', 'cypress-run'].some(
      (job) => conclusions[job] !== 'success',
    )
  )
    throw new Error('Cypress dependency did not succeed')
  if (reports.length !== matrix.include.length)
    throw new Error('Missing or duplicate shard reports')
  const lines = [
    '## Cypress results',
    '',
    '| Runner | Browser | Shard | Specs | Tests | Passed | Pending | Skipped | Spec duration |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const assignment of matrix.include) {
    const matches = reports.filter((report) =>
      ['runner', 'browser', 'shard'].every(
        (key) => report[key] === assignment[key],
      ),
    )
    if (matches.length !== 1)
      throw new Error('Missing or duplicate shard identity')
    validateReport(matches[0], assignment)
    const runs = matches[0].runs
    const total = (key) => runs.reduce((sum, run) => sum + run[key], 0)
    lines.push(
      `| ${assignment.runner} | ${assignment.browser} | ${assignment.shard}/${assignment.shardCount} | ${runs.length} | ${total('tests')} | ${total('passed')} | ${total('pending')} | ${total('skipped')} | ${(total('duration') / 1000).toFixed(1)}s |`,
    )
  }
  const slowest = [...reports].sort(
    (a, b) =>
      b.runs.reduce((sum, run) => sum + run.duration, 0) -
      a.runs.reduce((sum, run) => sum + run.duration, 0),
  )[0]
  lines.push(
    '',
    `Slowest shard by cumulative spec duration: ${slowest.runner}, ${slowest.browser}, ${slowest.shard}/${slowest.shardCount}.`,
  )
  return lines.join('\n') + '\n'
}

if (require.main === module) {
  ;(async () => {
    const reports = []
    for await (const file of fs.glob('cypress/reports/**/report.json'))
      reports.push(JSON.parse(await fs.readFile(file, 'utf8')))
    const jobs = JSON.parse(process.env.CYPRESS_JOB_RESULTS || '{}')
    const summary = checkReports(
      createMatrix(await discover(), process.env.CYPRESS_SHARDS || 4),
      reports,
      Object.fromEntries(
        Object.entries(jobs).map(([name, job]) => [name, job.result]),
      ),
    )
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  })().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
module.exports = { checkReports }
