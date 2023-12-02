const each = require('lodash/each')
const map = require('lodash/map')
const upperCase = require('lodash/upperCase')

const SwitchAccessory = require("./switchAccessory")
const SwitchStore = require('./switchStore')

class SwitchService {
  constructor (hap, cache, logger) {
    this.hap = hap
    this.cache = cache
    this.logger = logger
  }

  getHAPServices () {
    const services = map(SwitchStore.all(), 'service')
    this.logger.debug('num services', services.length)

    return services
  }

  createSwitchesFromConfig(conditions) {
    each(conditions, condition => {
      const { output, inputs, gate } = condition

      const inputSwitches = this._createSwitches(inputs)
      const outputSwitch = this._createSwitches([output])[0]

      outputSwitch.gateType = upperCase(gate)
      outputSwitch.inputs = inputSwitches

      each(inputSwitches, input => input.outputs.push(outputSwitch))
    })
  }

  _createSwitches (names) {
      return map(names, name => this._createSwitch(name))
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

  initSwitchValues () {
    // TODO: this could be made more efficient
    each(SwitchStore.all(), input => each(input.outputs, output => output.recalculate()))
  }
}

module.exports = SwitchService
