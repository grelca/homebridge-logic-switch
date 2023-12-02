const every = require('lodash/every')
const get = require('lodash/get')
const some = require('lodash/some')

// TODO: support more logic gates?
const LOGIC_GATES = {
  AND: every,
  OR: some,
  NOT: (inputs, callback) => !some(inputs, callback)
}

class SwitchAccessory {
  constructor (name, cache, logger) {
    this.name = name
    this.cache = cache
    this.logger = logger

    this.value = this.cache.get(name)

    // input switches have outputs
    this.outputs = [] // TODO better initialization

    // output switches have inputs and a gate type
    this.inputs = [] // TODO better initialization
    this.gateType = 'AND' // TODO better initialization
  }

  isInput () {
    return this.outputs.length > 0
  }

  isOutput () {
    return this.inputs.length > 0
  }

  configureService (hap) {
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

    const method = get(LOGIC_GATES, this.gateType, LOGIC_GATES.AND)
    const newValue = method(this.inputs, input => !!input.value)

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

    this.outputs.forEach(output => output.recalculate())
  }
}

module.exports = SwitchAccessory
