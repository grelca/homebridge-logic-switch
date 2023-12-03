import each from 'lodash/each'
import map from 'lodash/map'

import { type HAP, type Logging, type Service } from 'homebridge'

import SwitchAccessory from './switchAccessory'
import SwitchStore from './switchStore'
import type ICache from './types/cache'
import type IConfigCondition from './types/configCondition'
import type IDependencyChecker from './types/dependencyChecker'

export default class SwitchService {
  hasLoop?: boolean

  hap: HAP
  dependencyChecker: IDependencyChecker
  cache: ICache
  logger: Logging

  constructor (hap: HAP, dependencyChecker: IDependencyChecker, cache: ICache, logger: Logging) {
    this.hap = hap
    this.dependencyChecker = dependencyChecker
    this.cache = cache
    this.logger = logger
  }

  getHAPServices (): Service[] {
    // TODO: make this smarter, disable only the outputs with invalid inputs
    if (this.hasLoop === true) {
      return []
    }

    const services = map(SwitchStore.all(), 'service')
    this.logger.debug('num services', services.length)

    return services
  }

  createSwitchesFromConfig (conditions: IConfigCondition[]): void {
    each(conditions, condition => {
      const { output, inputs, gate } = condition

      const inputSwitches = map(inputs, name => this._createSwitch(name))
      const outputSwitch = this._createSwitch(output)

      each(inputSwitches, input => { input.updateOutputs(output) })
      outputSwitch.updateInputs(inputs, gate)
    })
  }

  _createSwitch (name: string): SwitchAccessory {
    if (!SwitchStore.exists(name)) {
      const value = this.cache.get(name)
      const s = new SwitchAccessory(name, value, this.cache, this.logger)
      SwitchStore.add(s)
    }

    return SwitchStore.getOne(name) as SwitchAccessory
  }

  createHAPServices (): void {
    each(SwitchStore.all(), s => s.createHAPService(this.hap))
  }

  detectLoops (): void {
    this.hasLoop = this.dependencyChecker.hasLoop()
  }

  initSwitchValues (): void {
    if (this.hasLoop !== false) {
      return
    }

    // TODO: this could be made more efficient
    each(SwitchStore.all(), input => each(input.getOutputs(), output => { output.recalculate() }))
  }
}
