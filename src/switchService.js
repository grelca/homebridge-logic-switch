const each = require('lodash/each')
const map = require('lodash/map')
const upperCase = require('lodash/upperCase')

const SwitchAccessory = require("./switchAccessory")

class SwitchService {
  switches = {}

  constructor (hap, cache, logger) {
    this.hap = hap
    this.cache = cache
    this.logger = logger
  }

  getSwitch (name) {
    return this.switches[name]
  }

  getAllSwitches () {
    return this.switches
  }

  getAllServices () {
    const services = map(this.switches, 'service')
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
    if (!this.switches[name]) {
      this.switches[name] = new SwitchAccessory(name, this.cache, this.logger)
    }

    return this.getSwitch(name)
  }

  createServices () {
    each(this.switches, s => s.configureService(this.hap))
  }

  initSwitchValues () {
    // TODO: this could be made more efficient
    each(this.switches, input => each(input.outputs, output => output.recalculate()))
  }
}

module.exports = SwitchService
