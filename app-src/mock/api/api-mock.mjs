import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import cors from 'cors'
import { App } from '@tinyhttp/app'
import fs from 'node:fs/promises'

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

ensureGeneratedServices(10)

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

// Ensure that for any service IDs referenced inside dashboardh.Nodes[].Tasks we have
// a corresponding service entry and task entries in the top-level lists. This makes
// endpoints like /ui/services/:id and /docker/services/:id reliably return details
// even when the original mocks omitted explicit service objects.
async function ensureNodeServiceDetails() {
  const nodes = (db.data.dashboardh && Array.isArray(db.data.dashboardh.Nodes)) ? db.data.dashboardh.Nodes : []
  db.data.services = db.data.services || []
  db.data.tasks = db.data.tasks || []
  db.data.ui = db.data.ui || { logs: { services: [] } }
  db.data.dashboardh = db.data.dashboardh || { Services: [] }
  db.data.dashboardv = db.data.dashboardv || { Services: [] }

  const serviceExists = (id) => db.data.services.some((s) => String(s.ID) === String(id))
  const taskExists = (id) => db.data.tasks.some((t) => String(t.ID) === String(id))

  for (const node of nodes) {
    if (!node || !node.Tasks) continue
    for (const svcId of Object.keys(node.Tasks)) {
      // ensure service object
      if (!serviceExists(svcId)) {
        const svcName = `svc_${svcId}`
        const minimalSvc = {
          ID: svcId,
          Name: svcName,
          Stack: '',
          Version: { Index: 1 },
          Spec: { Name: svcName, Labels: {} },
          Endpoint: { Ports: [] },
        }
        db.data.services.push(minimalSvc)
        // add UI log entry if not present
        if (!((db.data.ui && db.data.ui.logs && Array.isArray(db.data.ui.logs.services)) && db.data.ui.logs.services.some((x) => String(x.ID) === String(svcId)))) {
          db.data.ui.logs.services.push({ ID: svcId, Name: svcName })
        }
        // add to dashboardh/services list
        if (!((db.data.dashboardh && Array.isArray(db.data.dashboardh.Services)) && db.data.dashboardh.Services.some((x) => String(x.ID) === String(svcId)))) {
          db.data.dashboardh.Services.push({ ID: svcId, Name: svcName, Stack: '' })
        }
        // add to dashboardv/services list
        if (!((db.data.dashboardv && Array.isArray(db.data.dashboardv.Services)) && db.data.dashboardv.Services.some((x) => String(x.ID) === String(svcId)))) {
          db.data.dashboardv.Services.push({ ID: svcId, Name: svcName, Stack: '', Replication: '1', Tasks: {} })
        }
      }

      // ensure referenced tasks exist in top-level tasks array
      const refs = node.Tasks[svcId] || []
      for (const ref of refs) {
        const tid = ref && ref.ID
        if (!tid) continue
        if (!taskExists(tid)) {
          const task = {
            ID: tid,
            ServiceID: svcId,
            ServiceName: ref.ServiceName || `svc_${svcId}`,
            Stack: ref.Stack || '',
            NodeID: node.ID,
            NodeName: node.Hostname || node.Name || '',
            State: (ref.Status && ref.Status.State) || ref.State || 'running',
            Err: (ref.Status && ref.Status.Err) || ref.Err || '',
            CreatedAt: ref.CreatedAt || new Date().toISOString(),
            UpdatedAt: ref.UpdatedAt || new Date().toISOString(),
            DesiredState: ref.DesiredState || 'running',
            Timestamp: new Date().toISOString(),
            Slot: ref.Slot || 1,
          }
          db.data.tasks.push(task)
        }
      }
    }
  }

  // regenerate timeline if we may have added tasks
  generateTimelineFromTasks()

  // persist changes back to the JSON file so restarts keep the injected resources
  // To avoid rewriting the on-disk `mocks.json` (which changes formatting
  // and can break repo-level formatting expectations), we skip persisting
  // by default. If you really want to persist the synthesized entries back
  // into the file, start the mock with MOCK_PERSIST=1 in the environment.
  if (process.env.MOCK_PERSIST === '1') {
    // Write file with compact, one-line values for each top-level key.
    const serializeOneLineTopLevel = (obj) => {
      let out = '{\n'
      const keys = Object.keys(obj)
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        out += '  ' + JSON.stringify(k) + ': ' + JSON.stringify(obj[k])
        out += i < keys.length - 1 ? ',\n' : '\n'
      }
      out += '}\n'
      return out
    }

    try {
      const text = serializeOneLineTopLevel(db.data)
      const tmpFile = dataFile + '.tmp'
      const bakFile = dataFile + '.bak'
      try {
        // create a backup of existing file if present
        try {
          const existing = await fs.readFile(dataFile, 'utf8')
          await fs.writeFile(bakFile, existing, 'utf8')
        } catch (readErr) {
          // file might not exist - that's fine
        }

        // write to a temp file first and then rename — rename is atomic on POSIX
        await fs.writeFile(tmpFile, text, 'utf8')
        await fs.rename(tmpFile, dataFile)

        // Post-write sanity-check: read back and parse to ensure valid JSON
        try {
          const after = await fs.readFile(dataFile, 'utf8')
          JSON.parse(after)
          console.log('Persisted db atomically to', dataFile, 'with one-line top-level values (validated)')
        } catch (validationErr) {
          console.log('Error: persisted file failed JSON validation:', validationErr && validationErr.message)
          // Attempt to restore backup
          try {
            if ((await fs.stat(bakFile)).isFile()) {
              await fs.copyFile(bakFile, dataFile)
              console.log('Restored backup to', dataFile)
            }
          } catch (restoreErr) {
            console.log('Warning: failed to restore backup after validation failure', restoreErr && restoreErr.message)
          }
        }
      } catch (writeErr) {
        // best-effort cleanup of temp file
        try {
          await fs.unlink(tmpFile)
        } catch (_) {
          // ignore
        }
        console.log('Warning: failed to persist db atomically', writeErr && writeErr.message)
      }
    } catch (e) {
      console.log('Warning: failed to serialize db for persistence', e && e.message)
    }
  } else {
    console.log('Skipping write to preserve mocks.json formatting (set MOCK_PERSIST=1 to enable compact write)')
  }
}

await ensureNodeServiceDetails()

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
  const node = findResource(db.data?.nodes, req.params.id)
  if (node) {
    const tasks = (db.data?.tasks || []).filter(t => String(t.NodeID) === String(req.params.id))
    res.json({ node, tasks })
  } else {
    res.status(404).json({ error: 'node not found' })
  }
})

app.get('/docker/nodes/:id', (req, res) => {
  const node = findResource(db.data?.nodes, req.params.id)
  if (node) {
    const tasks = (db.data?.tasks || []).filter(t => t.NodeID === req.params.id)
    res.json({ node, tasks })
  } else {
    res.status(404).json({ error: 'node not found' })
  }
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

app.get('/docker/tasks/:id/metrics', (req, res) => {
  const taskId = req.params.id
  const task = findResource(db.data?.tasks, taskId)
  
  if (!task) {
    res.status(404).json({ error: 'task not found' })
    return
  }
  
  // Return mock metrics for the task
  res.json({
    usage: 268435456, // 256 MB
    workingSet: 201326592, // ~192 MB
    limit: 536870912, // 512 MB
    usagePercent: 50.0,
    cpuUsage: 123.45,
    cpuPercent: 45.0,
    containerId: `docker://abc123def456ghi789jkl012mno345pqr678stu901vwx234yz${taskId.substring(0, 8)}`
  })
})

app.get('/ui/services/:id', (req, res) => {
  const id = req.params.id
  const service = findResource(db.data?.services, id)
  if (service) {
    const tasks = (db.data?.tasks || []).filter(t => String(t.ServiceID) === String(id)).map(t => {
      // attach node object if available
      const node = findResource(db.data?.nodes, t.NodeID)
      return Object.assign({}, t, { Node: node || null })
    })
    res.json({ service, tasks })
    return
  }

  // Fallback: try to find service by name or spec name
  const svcByName = (db.data?.services || []).find((s) => {
    try {
      return s.Name === id || (s.Spec && s.Spec.Name === id)
    } catch (e) {
      return false
    }
  })
  if (svcByName) {
    const tasks = (db.data?.tasks || []).filter((t) => String(t.ServiceID) === String(svcByName.ID))
    res.json({ service: svcByName, tasks })
    return
  }

  res.status(404).json({ error: 'service not found' })
})

app.get('/docker/services/:id', (req, res) => {
  const id = req.params.id
  const service = findResource(db.data?.services, id)
  if (service) {
    const tasks = (db.data?.tasks || []).filter(t => t.ServiceID === id).map(t => {
      const node = findResource(db.data?.nodes, t.NodeID)
      return Object.assign({}, t, { Node: node || null })
    })
    res.json({ service, tasks })
    return
  }

  // Fallback: if id matches a node ID, try to find a service that has tasks on that node
  const tasksOnNode = (db.data?.tasks || []).filter((t) => String(t.NodeID) === String(id))
  if (tasksOnNode && tasksOnNode.length > 0) {
    const svcId = tasksOnNode[0].ServiceID
    const svc = (db.data?.services || []).find((s) => String(s.ID) === String(svcId)) || null
    const tasks = (db.data?.tasks || []).filter((t) => String(t.ServiceID) === String(svcId))
    res.json({ service: svc, tasks })
    return
  }

  // Fallback: try to find service by name or spec name
  const svcByName = (db.data?.services || []).find((s) => {
    try {
      return s.Name === id || (s.Spec && s.Spec.Name === id)
    } catch (e) {
      return false
    }
  })
  if (svcByName) {
    const tasks = (db.data?.tasks || []).filter((t) => String(t.ServiceID) === String(svcByName.ID))
    res.json({ service: svcByName, tasks })
    return
  }

  res.status(404).json({ error: 'service not found' })
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

// Mock node metrics endpoint
app.get('/docker/nodes/:id/metrics', (req, res) => {
  const nodeId = req.params.id
  
  // Return parsed metrics in the new JSON format (matching server-side parsing)
  res.json({
    available: true,
    metrics: {
      cpu: [
        { mode: 'idle', value: 25222.11 },
        { mode: 'iowait', value: 222.21 },
        { mode: 'irq', value: 0.27 },
        { mode: 'nice', value: 3.57 },
        { mode: 'softirq', value: 28.01 },
        { mode: 'steal', value: 0.0 },
        { mode: 'system', value: 869.34 },
        { mode: 'user', value: 1735.79 }
      ],
      memory: {
        total: 8589934592,        // 8GB
        free: 2147483648,         // 2GB
        available: 4294967296,    // 4GB
        swapTotal: 2147483648,    // 2GB swap
        swapFree: 1073741824,     // 1GB free
        swapUsed: 1073741824,     // 1GB used
        swapUsedPercent: 50.0
      },
      filesystem: [
        {
          device: '/dev/sda1',
          mountpoint: '/',
          size: 107374182400,      // 100GB
          available: 53687091200,  // 50GB
          used: 53687091200,       // 50GB
          usedPercent: 50.0
        },
        {
          device: '/dev/sdb1',
          mountpoint: '/var/lib/docker',
          size: 536870912000,      // 500GB
          available: 268435456000, // 250GB
          used: 268435456000,      // 250GB
          usedPercent: 50.0
        }
      ],
      network: [
        {
          interface: 'eth0',
          receiveBytes: 123456789012,
          transmitBytes: 987654321098,
          receivePackets: 456789012,
          transmitPackets: 654321098,
          receiveErrs: 12,
          transmitErrs: 8,
          receiveDrop: 3,
          transmitDrop: 2
        },
        {
          interface: 'eth1',
          receiveBytes: 98765432109,
          transmitBytes: 123456789012,
          receivePackets: 345678901,
          transmitPackets: 456789012,
          receiveErrs: 5,
          transmitErrs: 3,
          receiveDrop: 1,
          transmitDrop: 1
        }
      ],
      diskIO: [
        {
          device: 'sda',
          readsCompleted: 1234567,
          writesCompleted: 9876543,
          readBytes: 52428800000,       // ~50GB
          writtenBytes: 104857600000,   // ~100GB
          ioTimeSeconds: 12345.67,
          ioTimeWeightedSeconds: 23456.78
        },
        {
          device: 'sdb',
          readsCompleted: 987654,
          writesCompleted: 7654321,
          readBytes: 26214400000,       // ~25GB
          writtenBytes: 78643200000,    // ~75GB
          ioTimeSeconds: 8765.43,
          ioTimeWeightedSeconds: 17654.32
        }
      ],
      ntp: {
        offsetSeconds: 0.000123,
        syncStatus: 1
      },
      system: {
        load1: 0.52,
        load5: 0.48,
        load15: 0.45,
        bootTime: Date.now() / 1000 - 86400 * 7,  // Boot time 7 days ago
        uptimeSeconds: 86400 * 7,  // 7 days uptime
        numCPUs: 4,
        contextSwitches: 123456789,
        interrupts: 987654321,
        procsRunning: 3,
        procsBlocked: 0
      },
      tcp: {
        alloc: 512,
        inuse: 256,
        currEstab: 128,
        timeWait: 32
      },
      fileDescriptor: {
        allocated: 2048,
        maximum: 65536,
        usedPercent: 3.125
      },
      serverTime: Date.now() / 1000  // Current Unix timestamp
    }
  })
})

// Mock service metrics endpoint (cAdvisor)
app.get('/docker/services/:id/metrics', (req, res) => {
  const serviceId = req.params.id
  
  // Generate realistic container metrics for a service
  const containerCount = Math.floor(Math.random() * 3) + 2 // 2-4 containers
  const containers = []
  
  for (let i = 0; i < containerCount; i++) {
    const usage = Math.floor(Math.random() * 400) * 1024 * 1024 + 100 * 1024 * 1024 // 100-500 MB
    const limit = 512 * 1024 * 1024 // 512 MB limit
    const workingSet = usage * 0.9 // Working set is typically ~90% of usage
    const cpuUsage = Math.random() * 100 + 10 // 10-110 seconds of CPU time
    
    containers.push({
      containerId: `/docker/${Math.random().toString(36).substring(2, 15)}`,
      taskId: `task-${serviceId}-${i + 1}`,
      taskName: `service.${i + 1}`,
      usage: usage,
      workingSet: workingSet,
      limit: limit,
      usagePercent: (usage / limit) * 100,
      cpuUsage: cpuUsage,
      cpuPercent: Math.random() * 50 + 5, // 5-55% CPU usage
      serverTime: Date.now() / 1000
    })
  }
  
  const totalUsage = containers.reduce((sum, c) => sum + c.usage, 0)
  const totalLimit = containers.reduce((sum, c) => sum + c.limit, 0)
  const averageUsage = totalUsage / containers.length
  const averagePercent = (totalUsage / totalLimit) * 100
  
  res.json({
    available: true,
    metrics: {
      totalUsage: totalUsage,
      totalLimit: totalLimit,
      averageUsage: averageUsage,
      averagePercent: averagePercent,
      containers: containers,
      serverTime: Date.now() / 1000
    }
  })
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
