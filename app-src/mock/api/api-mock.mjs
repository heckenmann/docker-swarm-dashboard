import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import cors from 'cors'
import { App } from '@tinyhttp/app'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv
const port = parseInt(args[2] || '3001', 10)
const dataFile = path.join(process.cwd(), 'mock', 'api', 'mocks.json')

const adapter = new JSONFile(dataFile)
const db = new Low(adapter, {})
await db.read()
if (db.data == null) db.data = {}

const app = new App()
app.use(cors())

function findResource(resourceArray, id) {
  if (!Array.isArray(resourceArray)) return null
  return resourceArray.find((r) => String(r.ID) === String(id) || String(r.id) === String(id)) || null
}

function sendResource(res, resource, resourceName, id) {
  if (resource) {
    console.log(`Found ${resourceName}:`, resource)
    res.json(resource)
  } else {
    console.log(`No ${resourceName} found for ID:`, id)
    res.status(404).json({ error: `${resourceName} not found` })
  }
}

app.get('/ui/nodes/:id', (req, res) => {
  const resources = db.data?.nodes
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'nodes', req.params.id)
})

app.get('/docker/nodes/:id', (req, res) => {
  const resources = db.data?.nodes
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'nodes', req.params.id)
})

app.get('/ui/tasks/:id', (req, res) => {
  const resources = db.data?.tasks
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'tasks', req.params.id)
})

app.get('/docker/tasks/:id', (req, res) => {
  const resources = db.data?.tasks
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'tasks', req.params.id)
})

app.get('/ui/services/:id', (req, res) => {
  const resources = db.data?.services
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'services', req.params.id)
})

app.get('/docker/services/:id', (req, res) => {
  const resources = db.data?.services
  const resource = findResource(resources, req.params.id)
  sendResource(res, resource, 'services', req.params.id)
})

app.get('/ui/logs/services', (req, res) => {
  const resources = db.data?.['ui.logs.services'] || db.data?.['ui']?.logs?.services || []
  res.json(resources)
})

app.get('/ui/timeline', (req, res) => {
  const resources = db.data?.timeline || []
  res.json(resources)
})

app.get('/ui/dashboard-settings', (req, res) => {
  const resources = db.data?.['dashboard-settings'] || []
  res.json(resources)
})

// fallback to serve all resources under /ui and /docker
app.get('/ui/:resource', (req, res) => {
  const list = db.data?.[req.params.resource]
  if (list === undefined) return res.sendStatus(404)
  res.json(list)
})

app.get('/docker/:resource', (req, res) => {
  const list = db.data?.[req.params.resource]
  if (list === undefined) return res.sendStatus(404)
  res.json(list)
})

app.listen(port, () => {
  console.log('Mock API is running on port', port)
})
