#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const mocksPath = path.join(__dirname, '../api/mocks.json')
if (!fs.existsSync(mocksPath)) {
  console.error('mocks.json not found at', mocksPath)
  process.exit(2)
}

const raw = fs.readFileSync(mocksPath, 'utf8')
let data
try {
  data = JSON.parse(raw)
} catch (err) {
  console.error('Failed to parse mocks.json:', err.message)
  process.exit(2)
}

function collectServiceIds(d) {
  const ids = new Set()
  if (Array.isArray(d.services)) d.services.forEach(s => s && s.ID && ids.add(s.ID))
  // also include services referenced under dashboardh/ dashboardv / ui if present
  if (d.dashboardh && Array.isArray(d.dashboardh.Services)) d.dashboardh.Services.forEach(s => s && s.ID && ids.add(s.ID))
  if (d.dashboardv && Array.isArray(d.dashboardv.Services)) d.dashboardv.Services.forEach(s => s && s.ID && ids.add(s.ID))
  if (d['ui'] && d.ui.logs && Array.isArray(d.ui.logs.services)) d.ui.logs.services.forEach(s => s && s.ID && ids.add(s.ID))
  return ids
}

function collectNodeIds(d) {
  const ids = new Set()
  if (Array.isArray(d.nodes)) d.nodes.forEach(n => n && n.ID && ids.add(n.ID))
  if (d.dashboardv && Array.isArray(d.dashboardv.Nodes)) d.dashboardv.Nodes.forEach(n => n && n.ID && ids.add(n.ID))
  return ids
}

const serviceIds = collectServiceIds(data)
const nodeIds = collectNodeIds(data)

// Find collisions: same ID present in services and nodes
const collisions = [...nodeIds].filter(id => serviceIds.has(id))

const report = { collisions: [], updated: [], warnings: [] }

if (collisions.length === 0) {
  console.log('No ID collisions found between services and nodes.')
} else {
  console.log('Found ID collisions (service ID also used as node ID):', collisions)
}

// Helper to update NodeID references in arbitrary objects/arrays
function updateNodeIdReferences(obj, oldId, newId) {
  if (!obj) return 0
  let updated = 0
  function walk(o) {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o)) {
      o.forEach(item => walk(item))
      return
    }
    for (const k of Object.keys(o)) {
      const v = o[k]
      if (k === 'NodeID' && v === oldId) {
        o[k] = newId
        updated++
      } else if (typeof v === 'string') {
        // also handle top-level nodes lists where ID fields exist
        if (k === 'ID' && v === oldId) {
          o[k] = newId
          updated++
        }
      } else if (typeof v === 'object') {
        walk(v)
      }
    }
  }
  walk(obj)
  return updated
}

let totalUpdates = 0

for (const oldId of collisions) {
  // pick new id: prefix with node-
  let newId = `node-${oldId}`
  // ensure uniqueness
  let i = 1
  while (serviceIds.has(newId) || nodeIds.has(newId)) {
    newId = `node-${oldId}-${i}`
    i++
  }

  // update nodes array entry
  if (Array.isArray(data.nodes)) {
    for (const n of data.nodes) {
      if (n && n.ID === oldId) {
        n.ID = newId
        report.updated.push({type: 'node-id', from: oldId, to: newId})
        nodeIds.delete(oldId)
        nodeIds.add(newId)
        totalUpdates++
        break
      }
    }
  }

  // update dashboardv.Nodes
  if (data.dashboardv && Array.isArray(data.dashboardv.Nodes)) {
    for (const n of data.dashboardv.Nodes) {
      if (n && n.ID === oldId) {
        n.ID = newId
        report.updated.push({type: 'dashboardv.node', from: oldId, to: newId})
        totalUpdates++
        break
      }
    }
  }

  // update top-level tasks array NodeID fields
  if (Array.isArray(data.tasks)) {
    let c = 0
    for (const t of data.tasks) {
      if (t && t.NodeID === oldId) {
        t.NodeID = newId
        c++
      }
    }
    if (c) {
      report.updated.push({type: 'tasks.nodeid', from: oldId, to: newId, count: c})
      totalUpdates += c
    }
  }

  // update any NodeID references inside nodes[*].Tasks[*][*].NodeID
  if (Array.isArray(data.nodes)) {
    for (const n of data.nodes) {
      if (!n) continue
      // nodes[*].Tasks is an object mapping serviceID => tasks array
      if (n.Tasks && typeof n.Tasks === 'object') {
        for (const svcKey of Object.keys(n.Tasks)) {
          const arr = n.Tasks[svcKey]
          if (Array.isArray(arr)) {
            let cnt = 0
            for (const task of arr) {
              if (task && task.NodeID === oldId) {
                task.NodeID = newId
                cnt++
              }
            }
            if (cnt) {
              report.updated.push({type: 'nodes.tasks.nodeid', from: oldId, to: newId, count: cnt})
              totalUpdates += cnt
            }
          }
        }
      }
    }
  }

  // update any other NodeID occurrences anywhere in file
  const others = updateNodeIdReferences(data, oldId, newId)
  if (others) {
    report.updated.push({type: 'other.nodeid.refs', from: oldId, to: newId, count: others})
    totalUpdates += others
  }

  report.collisions.push({oldId, newId})
}

// Validate references now
const currentServiceIds = collectServiceIds(data)
const currentNodeIds = collectNodeIds(data)

// check tasks: every ServiceID should exist
if (Array.isArray(data.tasks)) {
  for (const t of data.tasks) {
    if (!t) continue
    if (t.ServiceID && !currentServiceIds.has(t.ServiceID)) {
      report.warnings.push({type: 'task.missing.service', id: t.ID, ServiceID: t.ServiceID})
    }
    if (t.NodeID && !currentNodeIds.has(t.NodeID)) {
      report.warnings.push({type: 'task.missing.node', id: t.ID, NodeID: t.NodeID})
    }
  }
}

// check nodes Tasks keys refer to services
if (Array.isArray(data.nodes)) {
  for (const n of data.nodes) {
    if (!n || !n.Tasks || typeof n.Tasks !== 'object') continue
    for (const svcKey of Object.keys(n.Tasks)) {
      if (!currentServiceIds.has(svcKey)) {
        report.warnings.push({type: 'nodes.tasks.missing.servicekey', nodeId: n.ID, serviceKey: svcKey})
      }
    }
  }
}

// check services tasks mapping in services[...].Tasks contains node IDs that exist
if (Array.isArray(data.services)) {
  for (const s of data.services) {
    if (!s || !s.Tasks || typeof s.Tasks !== 'object') continue
    for (const nodeKey of Object.keys(s.Tasks)) {
      if (!currentNodeIds.has(nodeKey)) {
        report.warnings.push({type: 'service.tasks.missing.nodekey', serviceId: s.ID, nodeKey})
      }
    }
  }
}

// write back if any updates
if (report.updated.length > 0) {
  // backup
  const bak = mocksPath + '.bak'
  fs.writeFileSync(bak, raw, 'utf8')
  // write with compact, one-line values per top-level key to match mock server formatting
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

  fs.writeFileSync(mocksPath, serializeOneLineTopLevel(data), 'utf8')
  console.log('Wrote updated mocks.json, backup at', bak)
}

console.log('\nSummary:')
console.log('Collisions handled:', report.collisions.length)
for (const c of report.collisions) console.log(' -', c.oldId, '->', c.newId)
console.log('Updated refs entries:', report.updated.length)
for (const u of report.updated) console.log(' -', JSON.stringify(u))
if (report.warnings.length) {
  console.log('\nWarnings:')
  for (const w of report.warnings) console.log(' -', JSON.stringify(w))
} else {
  console.log('No warnings.')
}

if (report.collisions.length === 0 && report.warnings.length === 0) {
  console.log('No changes necessary.')
}

process.exit(0)
