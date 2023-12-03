import { type API, type Logging, type AccessoryConfig, type Service } from 'homebridge'

import Cache from './cache'
import DependencyChecker from './dependencyChecker'
import InformationService from './informationService'
import SwitchService from './switchService'

export default function (homebridge: API): void {
  homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
  informationService: InformationService
  switchService: SwitchService

  constructor (logger: Logging, config: AccessoryConfig, homebridge: API) {
    // TODO: make whether this is stateful or not configurable
    const dir = homebridge.user.persistPath()
    const cache = new Cache(dir, config.name)
    const dependencyChecker = new DependencyChecker(logger)

    this.informationService = new InformationService(homebridge.hap, config.name)
    this.switchService = new SwitchService(homebridge.hap, dependencyChecker, cache, logger)

    this.switchService.createSwitchesFromConfig(config.conditions)
    this.switchService.createHAPServices()
    this.switchService.detectLoops()
    this.switchService.initSwitchValues()
  }

  getServices (): Service[] {
    const services = [this.informationService.getService(), ...this.switchService.getHAPServices()]
    if (services.length === 1) {
      // don't return information service without any actual accessories
      return []
    }

    return services
  }
}
