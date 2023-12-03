const Cache = require('./src/cache')
const DependencyChecker = require('./src/dependencyChecker')
const InformationService = require('./src/informationService')
const SwitchService = require('./src/switchService')

module.exports = function (homebridge) {
  homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
  constructor (logger, config, homebridge) {
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

  getServices () {
    const services = [this.informationService.getService(), ...this.switchService.getHAPServices()]
    if (services.length === 1) {
      // don't return information service without any actual accessories
      return []
    }

    return services
  }
}
