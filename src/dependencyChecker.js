const includes = require('lodash/includes')
const some = require('lodash/some')

const SwitchStore = require('./switchStore')

// utility class to make sure there are no circular dependencies
class DependencyChecker {
  constructor (logger) {
    this.logger = logger
  }

  hasLoop () {
    return some(SwitchStore.all(), s => this._hasLoopRecursive(s))
  }

  _hasLoopRecursive (s, inputs = []) {
    this.logger.debug('checking for loops', s.name, inputs)

    if (includes(inputs, s.name)) {
      this.logger.error('logic loop detected!', s.name, inputs)
      return true
    }

    const outputs = s.getOutputs()
    if (outputs.length === 0) {
      return false
    }

    inputs.push(s.name)
    return some(outputs, output => this._hasLoopRecursive(output, inputs))
  }
}

module.exports = DependencyChecker
