const each = require('lodash/each')
const map = require('lodash/map')

const SwitchAccessory = require('./switchAccessory')
const SwitchStore = require('./switchStore')

class SwitchService {
  hasLoop = false

  constructor (hap, dependencyChecker, cache, logger) {
    this.hap = hap
    this.dependencyChecker = dependencyChecker
    this.cache = cache
    this.logger = logger
  }

  getHAPServices () {
    // TODO: make this smarter, disable only the outputs with invalid inputs
    if (this.hasLoop) {
      return []
    }

    const services = map(SwitchStore.all(), 'service')
    this.logger.debug('num services', services.length)

    return services
  }

  createSwitchesFromConfig (conditions) {
    each(conditions, condition => {
      const { output, inputs, gate } = condition

      const inputSwitches = map(inputs, name => this._createSwitch(name))
      const outputSwitch = this._createSwitch(output)

      each(inputSwitches, input => input.updateOutputs(output))
      outputSwitch.updateInputs(inputs, gate)
    })
  }

  _createSwitch (name) {
    if (!SwitchStore.exists(name)) {
      const value = this.cache.get(name)
      const s = new SwitchAccessory(name, value, this.cache, this.logger)
      SwitchStore.add(name, s)
    }

    return SwitchStore.getOne(name)
  }

  createHAPServices () {
    each(SwitchStore.all(), s => s.createHAPService(this.hap))
  }

  detectLoops () {
    this.hasLoop = this.dependencyChecker.hasLoop()
  }

  initSwitchValues () {
    if (this.hasLoop) {
      return
    }

    // TODO: this could be made more efficient
    each(SwitchStore.all(), input => each(input.getOutputs(), output => output.recalculate()))
  }
}

module.exports = SwitchService
