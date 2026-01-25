const fs = require('fs')
const path = require('path')

const filePath = path.resolve(__dirname, '..', 'app-src', 'mock', 'api', 'mocks.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

let seen = new Map()
let changes = 0

function visit(obj) {
  if (Array.isArray(obj)) {
    obj.forEach((el) => visit(el))
    return
  }
  if (obj && typeof obj === 'object') {
    // detect task-like objects: have ID and either ServiceID or NodeID or Slot
    if (obj.ID && (obj.ServiceID || obj.NodeID || obj.Slot !== undefined)) {
      const id = String(obj.ID)
      if (seen.has(id)) {
        const count = seen.get(id) + 1
        seen.set(id, count)
        const newId = `${id}-dup${count}`
        obj.ID = newId
        changes++
      } else {
        seen.set(id, 0)
      }
    }
    Object.values(obj).forEach((v) => visit(v))
  }
}

visit(data)

if (changes > 0) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Patched ${changes} duplicate task ID(s) in ${filePath}`)
} else {
  console.log('No duplicate task IDs found')
}
