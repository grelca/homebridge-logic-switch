const includes = require('lodash/includes')
const some = require('lodash/some')

// utility class to make sure there are no circular dependencies
class DependencyChecker {
  constructor (switches, logger) {
    this.switches = switches
    this.logger = logger
  }

  hasLoop () {
    return some(this.switches, s => this._hasLoopRecursive(s))
  }

  _hasLoopRecursive (s, inputs = []) {
    this.logger.debug('checking for loops', s.name, inputs)

    if (includes(inputs, s.name)) {
      this.logger.error('logic loop detected!', s.name, inputs)
      return true
    }

    if (!s.isOutput()) {
      return false
    }

    inputs.push(s.name)
    return some(s.outputs, output => this._hasLoopRecursive(output, inputs))
  }
}

module.exports = DependencyChecker
