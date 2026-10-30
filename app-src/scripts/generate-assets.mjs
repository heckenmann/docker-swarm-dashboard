import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const assetsDirectory = new URL('../src/assets/', import.meta.url)
const faviconDirectory = new URL('../public/generated/', import.meta.url)
const svg = await readFile(new URL('swarm-dashboard.svg', assetsDirectory))

const renderPng = (size) =>
  sharp(svg, { density: 144 }).resize(size, size).png().toBuffer()

const [logo, ...icons] = await Promise.all([512, 16, 32, 48, 64].map(renderPng))
const favicon = await pngToIco(icons)

await mkdir(faviconDirectory, { recursive: true })
await Promise.all([
  writeFile(new URL('swarm-dashboard.png', assetsDirectory), logo),
  writeFile(new URL('favicon.ico', faviconDirectory), favicon),
])

console.log('Generated logo PNG and favicon from swarm-dashboard.svg')
