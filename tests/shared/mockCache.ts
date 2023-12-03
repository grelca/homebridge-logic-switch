import ICache from '../../src/types/cache'

const mockCache: ICache = {
  get: jest.fn(),
  set: jest.fn()
}

export default mockCache
