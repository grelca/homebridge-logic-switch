const every = require('lodash/every')
const get = require('lodash/get')
const some = require('lodash/some')
const upperCase = require('lodash/upperCase')

const SwitchStore = require('./switchStore')

// TODO: support more logic gates?
const LOGIC_GATES = {
  AND: every,
  OR: some,
  NOT: (inputs, callback) => !some(inputs, callback)
}

class SwitchAccessory {
  inputs = []
  outputs = []
  logicGate = 'AND'

  constructor (name, value, cache, logger) {
    this.name = name
    this.value = value
    this.cache = cache
    this.logger = logger
  }

  getInputs () {
    return SwitchStore.getList(this.inputs)
  }

  getOutputs () {
    return SwitchStore.getList(this.outputs)
  }

  isInput () {
    return this.getOutputs().length > 0
  }

  isOutput () {
    return this.getInputs().length > 0
  }

  updateInputs (inputs, gate) {
    this.inputs = inputs
    this.logicGate = upperCase(gate)
  }

  updateOutputs (output) {
    this.outputs.push(output)
  }

  createHAPService (hap) {
    if (this.isOutput()) {
      this.service = new hap.Service.MotionSensor(this.name, this.name)
      this.characteristic = this.service.getCharacteristic(hap.Characteristic.MotionDetected)
    } else {
      this.service = new hap.Service.Switch(this.name, this.name)
      this.characteristic = this.service.getCharacteristic(hap.Characteristic.On)
      this.characteristic.onSet((value) => this._setValue(value))
    }

    this.characteristic.onGet(() => !!this.value)
  }

  recalculate () {
    if (!this.isOutput()) {
      return this.logger.debug(`${this.name} is not an output switch`)
    }

    const method = get(LOGIC_GATES, this.logicGate, LOGIC_GATES.AND)
    const newValue = method(this.getInputs(), input => !!input.value)

    if (!!newValue === !!this.value) {
      return this.logger.debug(`${this.name} value not changed`)
    }

    this._setValue(newValue)
    this.characteristic.updateValue(this.value)
  }

  _setValue (value) {
    this.logger.info(`setting ${this.name} to ${value}`)

    this.value = value
    this.cache.set(this.name, value)

    this.getOutputs().forEach(output => output.recalculate())
  }
}

module.exports = SwitchAccessory
