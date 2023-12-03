import { Logging } from 'homebridge'

class MockLogger {
  prefix = 'mock-logger'

  default = jest.fn()
  log = jest.fn()
  debug = jest.fn()
  info = jest.fn()
  warn = jest.fn()
  error = jest.fn()
}

const logger = new MockLogger()

const mockLogger: Logging = logger.default.bind(logger)
mockLogger.prefix = logger.prefix
mockLogger.log = logger.log
mockLogger.debug = logger.debug
mockLogger.info = logger.info
mockLogger.warn = logger.warn
mockLogger.error = logger.error

export default mockLogger
