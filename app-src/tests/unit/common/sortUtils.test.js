import { sortData } from '../../../src/common/sortUtils'

describe('sortUtils', () => {
  describe('sortData', () => {
    it('returns original data when sortBy is null', () => {
      const data = [{ name: 'b' }, { name: 'a' }]
      const result = sortData(data, null, 'asc')
      expect(result).toBe(data)
    })

    it('returns original data when sortBy is undefined', () => {
      const data = [{ name: 'b' }, { name: 'a' }]
      const result = sortData(data, undefined, 'asc')
      expect(result).toBe(data)
    })

    it('sorts strings ascending', () => {
      const data = [{ name: 'charlie' }, { name: 'alice' }, { name: 'bob' }]
      const result = sortData(data, 'name', 'asc', { name: 'string' })
      expect(result[0].name).toBe('alice')
      expect(result[1].name).toBe('bob')
      expect(result[2].name).toBe('charlie')
    })

    it('sorts strings descending', () => {
      const data = [{ name: 'alice' }, { name: 'charlie' }, { name: 'bob' }]
      const result = sortData(data, 'name', 'desc', { name: 'string' })
      expect(result[0].name).toBe('charlie')
      expect(result[1].name).toBe('bob')
      expect(result[2].name).toBe('alice')
    })

    it('sorts numbers ascending', () => {
      const data = [{ port: 8080 }, { port: 80 }, { port: 443 }]
      const result = sortData(data, 'port', 'asc', { port: 'number' })
      expect(result[0].port).toBe(80)
      expect(result[1].port).toBe(443)
      expect(result[2].port).toBe(8080)
    })

    it('sorts numbers descending', () => {
      const data = [{ port: 80 }, { port: 8080 }, { port: 443 }]
      const result = sortData(data, 'port', 'desc', { port: 'number' })
      expect(result[0].port).toBe(8080)
      expect(result[1].port).toBe(443)
      expect(result[2].port).toBe(80)
    })

    it('sorts dates ascending', () => {
      const data = [
        { timestamp: '2023-03-01' },
        { timestamp: '2023-01-01' },
        { timestamp: '2023-02-01' },
      ]
      const result = sortData(data, 'timestamp', 'asc', { timestamp: 'date' })
      expect(result[0].timestamp).toBe('2023-01-01')
      expect(result[1].timestamp).toBe('2023-02-01')
      expect(result[2].timestamp).toBe('2023-03-01')
    })

    it('sorts dates descending', () => {
      const data = [
        { timestamp: '2023-01-01' },
        { timestamp: '2023-03-01' },
        { timestamp: '2023-02-01' },
      ]
      const result = sortData(data, 'timestamp', 'desc', { timestamp: 'date' })
      expect(result[0].timestamp).toBe('2023-03-01')
      expect(result[1].timestamp).toBe('2023-02-01')
      expect(result[2].timestamp).toBe('2023-01-01')
    })

    it('handles missing string values', () => {
      const data = [{ name: 'alice' }, {}, { name: 'bob' }]
      const result = sortData(data, 'name', 'asc', { name: 'string' })
      expect(result[0].name).toBe(undefined)
      expect(result[1].name).toBe('alice')
      expect(result[2].name).toBe('bob')
    })

    it('handles missing number values', () => {
      const data = [{ port: 80 }, {}, { port: 443 }]
      const result = sortData(data, 'port', 'asc', { port: 'number' })
      expect(result[0].port).toBe(undefined)
      expect(result[1].port).toBe(80)
      expect(result[2].port).toBe(443)
    })

    it('handles missing date values', () => {
      const data = [{ timestamp: '2023-01-01' }, {}, { timestamp: '2023-02-01' }]
      const result = sortData(data, 'timestamp', 'asc', { timestamp: 'date' })
      expect(result[0].timestamp).toBe(undefined)
      expect(result[1].timestamp).toBe('2023-01-01')
      expect(result[2].timestamp).toBe('2023-02-01')
    })

    it('defaults to string type when columnType not specified', () => {
      const data = [{ name: 'charlie' }, { name: 'alice' }]
      const result = sortData(data, 'name', 'asc', {})
      expect(result[0].name).toBe('alice')
      expect(result[1].name).toBe('charlie')
    })

    it('handles equal values', () => {
      const data = [{ name: 'alice', id: 1 }, { name: 'alice', id: 2 }]
      const result = sortData(data, 'name', 'asc', { name: 'string' })
      // Equal values should maintain stable sort
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })
  })
})
