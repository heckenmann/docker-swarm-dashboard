/** @jest-environment node */
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const {
  discover,
  createMatrix,
} = require('../../scripts/shard-cypress-specs.cjs')
const {
  validateReport,
  writeReport,
} = require('../../scripts/cypress-shard-report.cjs')
const { checkReports } = require('../../scripts/check-cypress-shards.cjs')

const files = Array.from(
  { length: 31 },
  (_, i) => `cypress/e2e/test-${i}.cy.js`,
)
const conclusions = {
  discover: 'success',
  prep: 'success',
  'cypress-run': 'success',
}
const reportFor = (entry) => ({
  ...entry,
  runs: entry.specs.map((spec) => ({
    spec,
    tests: 2,
    passed: 1,
    failed: 0,
    pending: 1,
    skipped: 0,
    duration: 100,
  })),
})

test('matrix preserves six pairs and exact-once coverage, deterministically', () => {
  const matrix = createMatrix(files)
  expect(matrix.include).toHaveLength(24)
  expect(matrix).toEqual(createMatrix([...files].reverse()))
  expect(matrix.include.slice(0, 4).map((entry) => entry.specs.length)).toEqual(
    [8, 8, 8, 7],
  )
  for (const entry of matrix.include.filter((entry) => entry.shard === 1)) {
    const assigned = matrix.include
      .filter(
        (other) =>
          other.runner === entry.runner && other.browser === entry.browser,
      )
      .flatMap((other) => other.specs)
    expect(assigned.sort()).toEqual([...files].sort())
  }
  expect(
    matrix.include
      .filter((entry) => entry.runner.endsWith('-arm'))
      .map((entry) => entry.browser),
  ).not.toContain('edge')
  expect(
    matrix.include
      .filter((entry) => entry.runner.endsWith('-arm'))
      .map((entry) => entry.browser),
  ).not.toContain('chromium')
  expect(createMatrix(files, 1).include).toHaveLength(6)
  expect(createMatrix(files.slice(0, 2), 8).include).toHaveLength(12)
})

test.each([0, -1, 1.5, 'bad', Infinity])(
  'rejects invalid shard count %s',
  (count) => {
    expect(() => createMatrix(files, count)).toThrow('Invalid shard count')
  },
)

test('rejects empty, duplicate, unsafe and oversized matrices', () => {
  expect(() => createMatrix([])).toThrow()
  expect(() => createMatrix([files[0], files[0]])).toThrow()
  for (const file of [
    'cypress/e2e/a,b.cy.js',
    'cypress/e2e/../a.cy.js',
    'cypress/e2e/a b.cy.js',
    '/tmp/a.cy.js',
  ])
    expect(() => createMatrix([file])).toThrow()
  expect(() =>
    createMatrix(
      Array.from({ length: 43 }, (_, i) => `cypress/e2e/${i}.cy.js`),
      43,
    ),
  ).toThrow('256')
})

test('discovery shares extensions and exclusions, ignoring symlinks and directories', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dsd-shard-test-'))
  try {
    for (const name of [
      'nested/a.cy.jsx',
      'b.cy.ts',
      'c.cy.tsx',
      'utils/d.cy.js',
      'node_modules/excluded.cy.js',
      'not-a-spec.js',
    ]) {
      const file = path.join(directory, 'cypress/e2e', name)
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, '')
    }
    await fs.mkdir(path.join(directory, 'cypress/e2e/directory.cy.js'))
    await fs.symlink(
      path.join(directory, 'cypress/e2e/b.cy.ts'),
      path.join(directory, 'cypress/e2e/link.cy.js'),
    )
    expect(await discover(directory)).toEqual(
      ['b.cy.ts', 'c.cy.tsx', 'nested/a.cy.jsx', 'utils/d.cy.js'].map(
        (file) => `cypress/e2e/${file}`,
      ),
    )
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

test('gate accepts complete reports, including intentional pending tests', () => {
  const matrix = createMatrix(files)
  expect(
    checkReports(matrix, matrix.include.map(reportFor), conclusions),
  ).toContain('Cypress results')
})

test.each(['failure', 'cancelled', 'skipped', undefined])(
  'gate rejects non-success dependency %s',
  (result) => {
    const matrix = createMatrix(files)
    for (const name of Object.keys(conclusions))
      expect(() =>
        checkReports(matrix, matrix.include.map(reportFor), {
          ...conclusions,
          [name]: result,
        }),
      ).toThrow()
  },
)

test('gate rejects missing, duplicate and partial reports', () => {
  const matrix = createMatrix(files)
  const reports = matrix.include.map(reportFor)
  expect(() => checkReports(matrix, reports.slice(1), conclusions)).toThrow()
  expect(() =>
    checkReports(matrix, [reports[0], ...reports.slice(0, -1)], conclusions),
  ).toThrow()
  expect(() =>
    checkReports(
      matrix,
      reports.map((report, i) =>
        i ? report : { ...report, runs: report.runs.slice(1) },
      ),
      conclusions,
    ),
  ).toThrow()
  const assignment = matrix.include[0]
  expect(() =>
    validateReport({ ...reports[0], browser: 'other' }, assignment),
  ).toThrow()
  for (const changes of [
    { passed: 99 },
    { skipped: undefined },
    { tests: 0 },
    { tests: NaN },
    { failed: 1 },
    { duration: -1 },
    { duration: NaN },
  ]) {
    expect(() =>
      validateReport(
        {
          ...reports[0],
          runs: reports[0].runs.map((run) => ({ ...run, ...changes })),
        },
        assignment,
      ),
    ).toThrow()
  }
  expect(() =>
    validateReport(
      { ...reports[0], runs: reports[0].runs.map(() => reports[0].runs[0]) },
      assignment,
    ),
  ).toThrow()
})

test('after:run writes sanitized report before rejecting incomplete execution', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dsd-report-test-'))
  const assignment = createMatrix(files.slice(0, 1), 1).include[0]
  try {
    const results = {
      runs: [
        {
          spec: { relative: assignment.specs[0] },
          stats: {
            tests: 1,
            passes: 1,
            failures: 0,
            pending: 0,
            skipped: 0,
            duration: 100,
          },
          response: 'sensitive data',
        },
      ],
    }
    expect(writeReport(results, assignment, directory).runs).toHaveLength(1)
    expect(
      await fs.readFile(path.join(directory, 'report.json'), 'utf8'),
    ).not.toContain('sensitive')
    expect(() => writeReport(undefined, assignment, directory)).toThrow()
    expect(
      JSON.parse(await fs.readFile(path.join(directory, 'report.json'), 'utf8'))
        .runs,
    ).toEqual([])
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

test('workflow CLI writes matrix outputs and validates downloaded artifacts', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dsd-shard-cli-'))
  const script = (name) => path.resolve(__dirname, '../../scripts', name)
  const output = path.join(directory, 'output.txt')
  const summary = path.join(directory, 'summary.md')
  const env = {
    ...process.env,
    CYPRESS_SHARDS: '4',
    GITHUB_OUTPUT: output,
    GITHUB_STEP_SUMMARY: summary,
  }
  try {
    await fs.mkdir(path.join(directory, 'cypress/e2e'), { recursive: true })
    await fs.writeFile(path.join(directory, 'cypress/e2e/example.cy.js'), '')
    const generation = spawnSync(
      process.execPath,
      [script('shard-cypress-specs.cjs')],
      { cwd: directory, env, encoding: 'utf8' },
    )
    expect(generation.status).toBe(0)
    const matrix = JSON.parse(generation.stdout)
    expect(await fs.readFile(output, 'utf8')).toBe(
      `matrix=${JSON.stringify(matrix)}\n`,
    )
    for (const entry of matrix.include) {
      const folder = path.join(
        directory,
        `cypress/reports/${entry.runner}-${entry.browser}-${entry.shard}`,
      )
      await fs.mkdir(folder, { recursive: true })
      await fs.writeFile(
        path.join(folder, 'report.json'),
        JSON.stringify(reportFor(entry)),
      )
    }
    env.CYPRESS_JOB_RESULTS = JSON.stringify(
      Object.fromEntries(
        Object.entries(conclusions).map(([name, result]) => [name, { result }]),
      ),
    )
    const gate = () =>
      spawnSync(process.execPath, [script('check-cypress-shards.cjs')], {
        cwd: directory,
        env,
        encoding: 'utf8',
      })
    expect(gate().status).toBe(0)
    expect(await fs.readFile(summary, 'utf8')).toContain('Cypress results')
    env.CYPRESS_JOB_RESULTS = JSON.stringify({
      discover: { result: 'failure' },
    })
    expect(gate().status).toBe(1)
    env.CYPRESS_SHARDS = 'invalid'
    expect(
      spawnSync(process.execPath, [script('shard-cypress-specs.cjs')], {
        cwd: directory,
        env,
      }).status,
    ).toBe(1)
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})
