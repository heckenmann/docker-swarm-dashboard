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

// Ensure we have a number of generated services for testing
const realisticNames = [
  'auth-service',
  'user-service',
  'payment-service',
  'email-service',
  'analytics-service',
  'cache-service',
]

const stackNames = ['backend', 'frontend', 'infra']

// Common error messages used for failed mock tasks
const errorMessages = [
  'OOMKilled while starting container',
  'ImagePullBackOff: failed to fetch image',
  'Permission denied mounting volume',
  'Container exited with code 1',
  'Network attach failed',
]

const ensureGeneratedServices = (count = 6) => {
  db.data.dashboardh = db.data.dashboardh || { Services: [], Nodes: [] }
  db.data.dashboardv = db.data.dashboardv || { Services: [], Nodes: [] }
  db.data.services = db.data.services || []
  // ports resource used by PortsComponent
  db.data.ports = db.data.ports || []
  db.data.ui = db.data.ui || { logs: { services: [] } }
  db.data.stacks = db.data.stacks || []

  const existingIds = new Set(db.data.services.map((s) => s.ID))
  for (let i = 1; i <= count; i++) {
    const id = `gensvc${i}`
    if (existingIds.has(id)) continue
    const baseName = realisticNames[(i - 1) % realisticNames.length]
    const stack = stackNames[(i - 1) % stackNames.length]
    const name = `${stack}_${baseName}`

    const svc = {
      ID: id,
      Name: name,
      Stack: stack,
      Replication: '1',
      Version: { Index: 1 },
      Spec: { Name: name, Labels: { 'com.docker.stack.namespace': stack } },
      Endpoint: {},
    }

    // Add a simple ports mapping for the mock service so /ui/ports returns usable data
    // Choose deterministic published/target ports to keep mocks stable
    const publishedPort = 8000 + i
    const targetPort = 8000 + i
    const portEntry = {
      PublishedPort: publishedPort,
      TargetPort: targetPort,
      Protocol: 'tcp',
      PublishMode: 'ingress',
      ServiceName: name,
      ServiceID: id,
      Stack: stack,
    }

    db.data.ports.push(portEntry)

    // also attach basic Endpoint.Ports metadata to the service object for completeness
    const endpointPortSpec = { Protocol: 'tcp', TargetPort: targetPort, PublishedPort: publishedPort, PublishMode: 'ingress' }
    svc.Endpoint = svc.Endpoint || {}
    svc.Endpoint.Ports = [endpointPortSpec]
    svc.Endpoint.Spec = svc.Endpoint.Spec || {}
    svc.Endpoint.Spec.Ports = [endpointPortSpec]

    // push into various mock locations (use prefixed name)
    db.data.dashboardh.Services.push({ ID: id, Name: name, Stack: stack })
    db.data.dashboardv.Services.push({ ID: id, Name: name, Stack: stack, Replication: '1', Tasks: {} })
    db.data.services.push(svc)
    db.data.ui.logs.services.push({ ID: id, Name: name })

    // ensure stack entry exists and add service reference
    let stackEntry = db.data.stacks.find((s) => s.Name === stack)
    if (!stackEntry) {
      stackEntry = { Name: stack, Services: [] }
      db.data.stacks.push(stackEntry)
    }
    stackEntry.Services.push({ ID: id, ServiceName: name, ShortName: name.replace(/[-_]/g, ''), Replication: '1', Created: new Date().toISOString(), Updated: new Date().toISOString() })
  }
}

ensureGeneratedServices(6)

// Create sample tasks for generated services with varied states
const createSampleTasks = () => {
  db.data.tasks = db.data.tasks || []
  // Prefer dashboardh.Nodes (mock layout) but fall back to top-level nodes
  const nodeArray = (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes) && db.data.dashboardh.Nodes.length)
    ? db.data.dashboardh.Nodes
    : (db.data.nodes || [])
  const nodeIds = nodeArray.map((n) => n.ID)
  const nodeMap = Object.fromEntries(nodeArray.map((n) => [n.ID, n]))
  const states = ['running', 'pending', 'failed', 'shutdown', 'complete']
  const errorMessages = [
    'OOMKilled while starting container',
    'ImagePullBackOff: failed to fetch image',
    'Permission denied mounting volume',
    'Container exited with code 1',
    'Network attach failed',
  ]

  // For each generated service, create 1..3 tasks distributed across nodes.
  for (let i = 1; i <= 6; i++) {
    const svcId = `gensvc${i}`
    // create between 1 and 3 tasks deterministically: 1 + (i % 3)
    const tasksCount = 1 + (i % 3)

    for (let j = 0; j < tasksCount; j++) {
      const taskId = `task-${svcId}-${j + 1}`
  const nodeId = nodeIds.length ? nodeIds[(i + j) % nodeIds.length] : null
  const nodeName = nodeId ? (nodeMap[nodeId]?.Hostname || nodeMap[nodeId]?.Name || '') : null
    const state = states[(i + j) % states.length]
  const svcObj = (db.data.services || []).find((s) => s.ID === svcId)
  const svcName = svcObj ? svcObj.Name : `service-${i}`
  const svcStack = svcObj ? (svcObj.Stack || (svcObj.Spec && svcObj.Spec.Labels && svcObj.Spec.Labels['com.docker.stack.namespace']) || '') : ''
  const errMsg = state === 'failed' ? `${errorMessages[(i + j) % errorMessages.length]} for ${svcName}` : ''
      const task = {
        ID: taskId,
        ServiceID: svcId,
        ServiceName: svcName,
        Stack: svcStack,
        NodeID: nodeId,
        NodeName: nodeName,
        State: state,
        Err: errMsg,
        CreatedAt: new Date(Date.now() - (j * 60000)).toISOString(),
        UpdatedAt: new Date().toISOString(),
        DesiredState: state === 'running' ? 'running' : 'shutdown',
        Timestamp: new Date().toISOString(),
        Slot: j + 1,
      }

      // Add to global tasks list
      db.data.tasks.push(task)

      // Attach to dashboardv Services Tasks (grouped by node)
      if (db.data.dashboardv && Array.isArray(db.data.dashboardv.Services)) {
        const sv = db.data.dashboardv.Services.find((s) => s.ID === svcId)
        if (sv) {
          sv.Tasks = sv.Tasks || {}
          if (nodeId) sv.Tasks[nodeId] = sv.Tasks[nodeId] || []
          const taskRef = { ID: taskId, Status: { State: state, Err: errMsg, Timestamp: new Date().toISOString() }, NodeID: nodeId, NodeName: nodeName, ServiceID: svcId, Stack: svcStack, CreatedAt: new Date(Date.now() - (j * 60000)).toISOString(), UpdatedAt: new Date().toISOString() }
          if (nodeId) sv.Tasks[nodeId].push(taskRef)
          else { sv.Tasks['unassigned'] = sv.Tasks['unassigned'] || []; sv.Tasks['unassigned'].push(taskRef) }
        }
      }

      // Attach to dashboardh Nodes Tasks (per-node, per-service)
      if (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes)) {
        if (nodeId) {
          const node = (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes))
            ? db.data.dashboardh.Nodes.find((n) => n.ID === nodeId)
            : (db.data.nodes || []).find((n) => n.ID === nodeId)
          if (node) {
            node.Tasks = node.Tasks || {}
            node.Tasks[svcId] = node.Tasks[svcId] || []
            node.Tasks[svcId].push({ ID: taskId, Status: { State: state, Err: errMsg, Timestamp: new Date().toISOString() }, NodeID: nodeId, NodeName: nodeName, ServiceID: svcId, CreatedAt: new Date(Date.now() - (j * 60000)).toISOString(), UpdatedAt: new Date().toISOString() })
          }
        } else {
          // If no node assigned, add a top-level reference (optional)
          db.data.dashboardh.UnassignedTasks = db.data.dashboardh.UnassignedTasks || []
          db.data.dashboardh.UnassignedTasks.push({ ID: taskId, ServiceID: svcId, ServiceName: svcName, Stack: svcStack, Status: { State: state, Err: errMsg, Timestamp: new Date().toISOString() }, CreatedAt: new Date(Date.now() - (j * 60000)).toISOString(), UpdatedAt: new Date().toISOString() })
        }
      }
    }
  }
}

createSampleTasks()

// Add one additional task per generated service on an existing node (if any)
const addExtraTasksOnExistingNode = () => {
  const nodeArray = (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes) && db.data.dashboardh.Nodes.length)
    ? db.data.dashboardh.Nodes
    : (db.data.nodes || [])
  const nodeIds = nodeArray.map((n) => n.ID)
  const nodeMap = Object.fromEntries(nodeArray.map((n) => [n.ID, n]))
  if (!nodeIds.length) return
  const states = ['running', 'pending', 'failed', 'shutdown', 'complete']

  for (let i = 1; i <= 6; i++) {
    const svcId = `gensvc${i}`
    const extraTaskId = `task-${svcId}-extra`
    if ((db.data.tasks || []).some((t) => t.ID === extraTaskId)) continue

    // pick an existing node (first one) so we create a second task on an existing host
  const nodeId = nodeIds[0]
  const nodeName = nodeMap[nodeId] ? (nodeMap[nodeId].Hostname || nodeMap[nodeId].Name || '') : null
  const state = states[(i + 2) % states.length]
  const svcObj = (db.data.services || []).find((s) => s.ID === svcId)
  const svcName = svcObj ? svcObj.Name : `service-${i}`
  const svcStack = svcObj ? (svcObj.Stack || (svcObj.Spec && svcObj.Spec.Labels && svcObj.Spec.Labels['com.docker.stack.namespace']) || '') : ''
  const errMsg = state === 'failed' ? `${errorMessages[(i + 2) % errorMessages.length]} for ${svcName}` : ''

    const extraTask = {
      ID: extraTaskId,
      ServiceID: svcId,
      ServiceName: svcName,
      Stack: svcStack,
      NodeID: nodeId,
      NodeName: nodeName,
      State: state,
      Err: errMsg,
      DesiredState: state === 'running' ? 'running' : 'shutdown',
      Timestamp: new Date().toISOString(),
      Slot: 99,
    }

    db.data.tasks.push(extraTask)

    // attach to dashboardv
    if (db.data.dashboardv && Array.isArray(db.data.dashboardv.Services)) {
      const sv = db.data.dashboardv.Services.find((s) => s.ID === svcId)
      if (sv) {
        sv.Tasks = sv.Tasks || {}
        sv.Tasks[nodeId] = sv.Tasks[nodeId] || []
  sv.Tasks[nodeId].push({ ID: extraTaskId, Status: { State: state, Err: errMsg }, NodeID: nodeId, NodeName: nodeName, ServiceID: svcId, Stack: svcStack })
      }
    }

    // attach to dashboardh
    if (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes)) {
      const node = db.data.dashboardh.Nodes.find((n) => n.ID === nodeId)
      if (node) {
        node.Tasks = node.Tasks || {}
  node.Tasks[svcId] = node.Tasks[svcId] || []
  node.Tasks[svcId].push({ ID: extraTaskId, Status: { State: state, Err: errMsg }, NodeID: nodeId, NodeName: nodeName, ServiceID: svcId, Stack: svcStack })
      }
    }
  }
}

addExtraTasksOnExistingNode()

// Generate timeline entries from tasks so /ui/timeline always returns usable data
const generateTimelineFromTasks = () => {
  db.data.timeline = db.data.timeline || []
  const tasks = Array.isArray(db.data.tasks) ? db.data.tasks : []
  db.data.timeline = tasks.map((t) => {
    const createdRaw = t.CreatedTimestamp || t.createdTimestamp || t.CreatedAt || t.Timestamp || ''
    // If task is no longer running, use UpdatedAt/Timestamp as stopped time; otherwise empty string
    let stoppedRaw = ''
    if (t.StoppedTimestamp) stoppedRaw = t.StoppedTimestamp
    else if (t.StoppedAt) stoppedRaw = t.StoppedAt
    else if (t.State && t.State !== 'running') stoppedRaw = t.UpdatedAt || t.Timestamp || ''

    return {
      ID: t.ID || `tl-${Math.random().toString(36).slice(2, 9)}`,
      CreatedTimestamp: createdRaw,
      StoppedTimestamp: stoppedRaw || '',
      State: t.State || (t.Status && t.Status.State) || '',
      DesiredState: t.DesiredState || '',
      Slot: t.Slot || 0,
      ServiceName: t.ServiceName || t.ServiceID || '',
      ServiceID: t.ServiceID || '',
      Stack: t.Stack || '',
    }
  })
}

// generate timeline now (and could be called again if tasks change)
generateTimelineFromTasks()

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
