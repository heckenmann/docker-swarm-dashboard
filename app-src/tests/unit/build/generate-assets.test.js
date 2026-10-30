/** @jest-environment node */

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const sharp = require('sharp')

const appDirectory = path.resolve(__dirname, '../../..')
let directory
let source
let pngPath
let iconPath

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dsd-logo-'))
  fs.mkdirSync(path.join(directory, 'scripts'))
  fs.mkdirSync(path.join(directory, 'src/assets'), { recursive: true })
  fs.symlinkSync(
    path.join(appDirectory, 'node_modules'),
    path.join(directory, 'node_modules'),
    'junction',
  )
  fs.copyFileSync(
    path.join(appDirectory, 'scripts/generate-assets.mjs'),
    path.join(directory, 'scripts/generate-assets.mjs'),
  )
  source = path.join(directory, 'src/assets/swarm-dashboard.svg')
  fs.copyFileSync(
    path.join(appDirectory, 'src/assets/swarm-dashboard.svg'),
    source,
  )
  pngPath = path.join(directory, 'src/assets/swarm-dashboard.png')
  iconPath = path.join(directory, 'public/generated/favicon.ico')
})

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true })
})

const generate = () =>
  execFileSync(
    process.execPath,
    [path.join(directory, 'scripts/generate-assets.mjs')],
    { cwd: os.tmpdir(), stdio: 'pipe', timeout: 30000 },
  )

test('renders the project SVG to a transparent PNG and a multi-size ICO', async () => {
  generate()
  expect(await sharp(pngPath).metadata()).toMatchObject({
    format: 'png',
    width: 512,
    height: 512,
    hasAlpha: true,
  })
  const pixels = await sharp(pngPath).ensureAlpha().raw().toBuffer()
  expect(pixels[3]).toBe(0)
  for (const rgb of [
    [0, 21, 60],
    [37, 96, 255],
    [217, 229, 252],
  ]) {
    expect(pixels.includes(Buffer.from([...rgb, 255]))).toBe(true)
  }

  const icon = fs.readFileSync(iconPath)
  expect(icon.readUInt16LE(0)).toBe(0)
  expect(icon.readUInt16LE(2)).toBe(1)
  expect(icon.readUInt16LE(4)).toBe(4)
  for (const [index, size] of [16, 32, 48, 64].entries()) {
    const entry = 6 + index * 16
    expect(icon[entry]).toBe(size)
    expect(icon[entry + 1]).toBe(size)
    const length = icon.readUInt32LE(entry + 8)
    const offset = icon.readUInt32LE(entry + 12)
    expect(offset).toBeGreaterThanOrEqual(70)
    expect(offset + length).toBeLessThanOrEqual(icon.length)
    expect(icon.readInt32LE(offset + 4)).toBe(size)
    expect(icon.readInt32LE(offset + 8)).toBe(size * 2)
  }
})

test('regenerates both outputs when the SVG changes', () => {
  generate()
  const png = fs.readFileSync(pngPath)
  const icon = fs.readFileSync(iconPath)
  fs.writeFileSync(
    source,
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#2560FF"/></svg>',
  )
  generate()
  expect(fs.readFileSync(pngPath).equals(png)).toBe(false)
  expect(fs.readFileSync(iconPath).equals(icon)).toBe(false)
})

test('fails on invalid SVG instead of producing replacement assets', () => {
  fs.writeFileSync(source, '<svg>')
  expect(() => generate()).toThrow()
  expect(fs.existsSync(pngPath)).toBe(false)
  expect(fs.existsSync(iconPath)).toBe(false)
})
