const Cache = require('./src/cache')
const DependencyChecker = require('./src/dependencyChecker')
const SwitchService = require('./src/switchService')

module.exports = function (homebridge) {
    homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
    hasLoop = false

    constructor (logger, config, homebridge) {
        // TODO: make whether this is stateful or not configurable
        const dir = homebridge.user.persistPath();
        const cache = new Cache(dir, config.name)

        this.switchService = new SwitchService(homebridge.hap, cache, logger)
        this.dependencyChecker = new DependencyChecker(logger)

        this._initInformationService(homebridge.hap, config.name)
        this._configureSwitches(config)
        this._createServices()
        this._detectLoops()
        this._initOutputValues()
    }

    getServices () {
        // TODO: make this smarter, disable only the outputs with invalid inputs
        if (this.hasLoop) {
            return []
        }

        const services = this.switchService.getHAPServices()
        if (services.length > 0) {
            // don't return information service without any actual accessories
            services.unshift(this.informationService)
        }

        return services
    }

    _initInformationService (hap, name) {
        this.informationService = new hap.Service.AccessoryInformation()
        this.informationService.setCharacteristic(hap.Characteristic.Manufacturer, 'Logic Switch')
            .setCharacteristic(hap.Characteristic.Model, 'Logic Switch')
            .setCharacteristic(hap.Characteristic.FirmwareRevision, require('./package.json').version)
            .setCharacteristic(hap.Characteristic.SerialNumber, hap.uuid.generate(name))
    }

    _configureSwitches ({ conditions }) {
        this.switchService.createSwitchesFromConfig(conditions)
    }

    _createServices () {
        this.switchService.createHAPServices()
    }

    _detectLoops () {
        this.hasLoop = this.dependencyChecker.hasLoop()
    }

    _initOutputValues () {
        if (this.hasLoop) {
            return
        }

        this.switchService.initSwitchValues()
    }
}
