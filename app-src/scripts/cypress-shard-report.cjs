const { writeFileSync, mkdirSync } = require('node:fs')
const path = require('node:path')

/** Validate exact spec coverage and usable test results.
 * @param {object} report Shard report.
 * @param {object} assignment Expected matrix entry.
 * @returns {void} Throws for missing or unsuccessful execution.
 */
function validateReport(report, assignment) {
  for (const key of ['runner', 'browser', 'shard', 'shardCount']) {
    if (report[key] !== assignment[key]) throw new Error(`Wrong report ${key}`)
  }
  const actual = report.runs.map((run) => run.spec).sort()
  if (JSON.stringify(actual) !== JSON.stringify([...assignment.specs].sort()))
    throw new Error('Spec coverage mismatch')
  if (
    !report.runs.length ||
    report.runs.some(
      (run) =>
        !['tests', 'passed', 'failed', 'pending', 'skipped'].every(
          (key) => Number.isSafeInteger(run[key]) && run[key] >= 0,
        ) ||
        run.tests < 1 ||
        run.failed !== 0 ||
        run.tests !== run.passed + run.failed + run.pending + run.skipped ||
        !Number.isFinite(run.duration) ||
        run.duration < 0,
    )
  )
    throw new Error('Incomplete or failed shard')
}

/** Write a sanitized report before validating the shard.
 * @param {object} results Cypress after:run results.
 * @param {object} assignment Expected matrix entry.
 * @param {string} directory Report directory.
 * @returns {object} Report containing no application data.
 */
function writeReport(results, assignment, directory = 'cypress/reports') {
  const report = {
    ...assignment,
    runs: (results?.runs || []).map((run) => ({
      spec: run.spec.relative.replaceAll('\\', '/'),
      tests: run.stats.tests,
      passed: run.stats.passes,
      failed: run.stats.failures,
      pending: run.stats.pending,
      skipped: run.stats.skipped,
      duration: run.stats.duration,
    })),
  }
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    path.join(directory, 'report.json'),
    JSON.stringify(report, null, 2),
  )
  validateReport(report, assignment)
  return report
}

module.exports = { validateReport, writeReport }
