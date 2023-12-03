import every from 'lodash/every'
import get from 'lodash/get'
import some from 'lodash/some'
import upperCase from 'lodash/upperCase'

import { type Characteristic, type HAP, type Logging, type Service } from 'homebridge'

import SwitchStore from './switchStore'
import type ICache from './types/cache'
import type ISwitchAccessory from './types/switchAccessory'

// TODO: support more logic gates?
const LOGIC_GATES = {
  AND: every,
  OR: some,
  NOT: (inputs: ISwitchAccessory[], callback: (input: ISwitchAccessory) => boolean) => !some(inputs, callback)
}

export default class SwitchAccessory implements ISwitchAccessory {
  name: string
  value: boolean

  inputs: string[] = []
  outputs: string[] = []
  logicGate: string = 'AND'

  cache: ICache
  logger: Logging

  service: Service
  characteristic: Characteristic

  constructor (name: string, value: boolean, cache: ICache, logger: Logging) {
    this.name = name
    this.value = value
    this.cache = cache
    this.logger = logger
  }

  getInputs (): ISwitchAccessory[] {
    return SwitchStore.getList(...this.inputs)
  }

  getOutputs (): ISwitchAccessory[] {
    return SwitchStore.getList(...this.outputs)
  }

  isInput (): boolean {
    return this.outputs.length > 0
  }

  isOutput (): boolean {
    return this.inputs.length > 0
  }

  updateInputs (inputs: string[], gate: string): void {
    this.inputs = inputs
    this.logicGate = upperCase(gate)
  }

  updateOutputs (output: string): void {
    this.outputs.push(output)
  }

  createHAPService (hap: HAP): void {
    if (this.isOutput()) {
      this.service = new hap.Service.MotionSensor(this.name, this.name)
      this.characteristic = this.service.getCharacteristic(hap.Characteristic.MotionDetected)
    } else {
      this.service = new hap.Service.Switch(this.name, this.name)
      this.characteristic = this.service.getCharacteristic(hap.Characteristic.On)
      this.characteristic.onSet((value) => { this._setValue(Boolean(value)) })
    }

    this.characteristic.onGet(() => this.value)
  }

  recalculate (): void {
    if (!this.isOutput()) {
      this.logger.debug(`${this.name} is not an output switch`); return
    }

    const method = get(LOGIC_GATES, this.logicGate, LOGIC_GATES.AND)
    const newValue = method(this.getInputs(), input => !!input.value)

    if (newValue === this.value) {
      this.logger.debug(`${this.name} value not changed`); return
    }

    this._setValue(newValue)
    this.characteristic.updateValue(this.value)
  }

  _setValue (value: boolean): void {
    this.logger.info(`setting ${this.name} to ${value}`)

    this.value = value
    this.cache.set(this.name, value)

    if (this.isInput()) {
      this.getOutputs().forEach(output => { output.recalculate() })
    }
  }
}
