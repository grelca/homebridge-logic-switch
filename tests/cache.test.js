const Cache = require('../src/cache')
const path = require('path')

const directory = path.join(__dirname, '/test-storage')
const cache = new Cache(directory)

describe('cache operations', () => {
  beforeEach(() => cache.clear())

  test('values can be stored and retrieved', () => {
    cache.set('key1', true)
    expect(cache.get('key1')).toBe(true)
  })

  test('nothing is returned for an uncached keys', () => {
    expect(cache.get('key2')).toBe(undefined)
  })

  test('cache can be cleared', () => {
    cache.set('key3', 123)
    expect(cache.get('key3')).toBe(123)
    cache.clear()
    expect(cache.get('key3')).toBe(undefined)
  })
})
