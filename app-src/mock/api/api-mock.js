const jsonServer = require('json-server')
const cors = require('cors')
const server = jsonServer.create()
const rootRouter = jsonServer.router('mock/api/mocks.json')
const middlewares = jsonServer.defaults()
const args = process.argv

server.use(middlewares)
server.use(cors())
function handleResourceRequest(req, res, resourceName) {
  const resourceId = req.params.id

  const resources = rootRouter.db.get(resourceName)

  const resource = resources.find({ ID: resourceId }).value()

  if (resource) {
    console.log(`Found ${resourceName}:`, resource)
    res.jsonp(resource)
  } else {
    console.log(`No ${resourceName} found for ID:`, resourceId)
    res.status(404).jsonp({ error: `${resourceName} not found` })
  }
}

// Handler für /ui/nodes
server.get('/ui/nodes/:id', (req, res) => {
  handleResourceRequest(req, res, 'nodes')
})
server.get('/docker/nodes/:id', (req, res) => {
  handleResourceRequest(req, res, 'nodes')
})

// Handler für /ui/tasks
server.get('/ui/tasks/:id', (req, res) => {
  handleResourceRequest(req, res, 'tasks')
})
server.get('/docker/tasks/:id', (req, res) => {
  handleResourceRequest(req, res, 'tasks')
})

// Handler für /ui/services
server.get('/ui/services/:id', (req, res) => {
  handleResourceRequest(req, res, 'services')
})
server.get('/docker/services/:id', (req, res) => {
  handleResourceRequest(req, res, 'services')
})

server.get('/ui/logs/services', (req, res) => {
  const resources = rootRouter.db.get('ui.logs.services')
  res.jsonp(resources)
})

// Handler für alle anderen Routen
server.use('/ui', rootRouter)
server.use('/docker', rootRouter)

server.listen(args[2], () => {
  console.log('JSON Server is running on port', args[2])
})
