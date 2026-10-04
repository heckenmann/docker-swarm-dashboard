const fs = require('node:fs/promises')
const { appendFileSync } = require('node:fs')
const patterns = require('./cypress-spec-patterns.cjs')

const pairs = [
  ['ubuntu-24.04', 'firefox'],
  ['ubuntu-24.04', 'electron'],
  ['ubuntu-24.04', 'chromium'],
  ['ubuntu-24.04', 'edge'],
  ['ubuntu-24.04-arm', 'firefox'],
  ['ubuntu-24.04-arm', 'electron'],
]

/** Discover regular E2E specs using the same patterns as Cypress.
 * @param {string} cwd Project directory.
 * @returns {Promise<string[]>} Sorted project-relative paths.
 */
async function discover(cwd = process.cwd()) {
  const files = []
  for await (const entry of fs.glob(patterns.specPattern, {
    cwd,
    exclude: patterns.excludeSpecPattern,
    withFileTypes: true,
  })) {
    if (entry.isFile()) {
      const path = require('node:path')
      files.push(
        path
          .relative(cwd, path.join(entry.parentPath, entry.name))
          .split(path.sep)
          .join('/'),
      )
    }
  }
  return files.sort()
}

/** Build a complete, deterministic browser/runner/shard matrix.
 * @param {string[]} files Discovered spec paths.
 * @param {number|string} requested Requested shard count.
 * @returns {{include: object[]}} GitHub Actions matrix.
 */
function createMatrix(files, requested = 4) {
  const count = Number(requested)
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error('Invalid shard count')
  if (!files.length || new Set(files).size !== files.length)
    throw new Error('Empty or duplicate spec set')
  if (
    files.some(
      (file) =>
        !/^cypress\/e2e\/[a-zA-Z0-9_./-]+\.cy\.(js|jsx|ts|tsx)$/.test(file) ||
        file.split('/').includes('..'),
    )
  ) {
    throw new Error('Unsafe spec path')
  }
  const shardCount = Math.min(count, files.length)
  if (shardCount * pairs.length > 256)
    throw new Error('Matrix exceeds 256 jobs')
  const groups = Array.from({ length: shardCount }, () => [])
  ;[...files]
    .sort()
    .forEach((file, index) => groups[index % shardCount].push(file))
  return {
    include: pairs.flatMap(([runner, browser]) =>
      groups.map((specs, index) => ({
        runner,
        browser,
        shard: index + 1,
        shardCount,
        specs,
      })),
    ),
  }
}

if (require.main === module) {
  discover()
    .then((files) => {
      const matrix = createMatrix(files, process.env.CYPRESS_SHARDS || 4)
      const json = JSON.stringify(matrix)
      if (process.env.GITHUB_OUTPUT)
        appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${json}\n`)
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `## Cypress shards\n\n\`\`\`json\n${JSON.stringify(matrix, null, 2)}\n\`\`\`\n`,
        )
      console.log(json)
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}

module.exports = { discover, createMatrix }
