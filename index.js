const Cache = require('./src/cache')
const DependencyChecker = require('./src/dependencyChecker')
const SwitchService = require('./src/switchService')

module.exports = function (homebridge) {
    homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
    hasLoop = false

    constructor (logger, config, homebridge) {
        this.hap = homebridge.hap
        this.name = config.name

        // TODO: make whether this is stateful or not configurable
        const dir = homebridge.user.persistPath();
        const cache = new Cache(dir, config.name)

        this.switchService = new SwitchService(this.hap, cache, logger)
        this.dependencyChecker = new DependencyChecker(logger)

        this._initInformationService()
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

        const services = this.switchService.getAllServices()
        if (services.length > 0) {
            // don't return information service without any actual accessories
            services.unshift(this.informationService)
        }

        return services
    }

    _initInformationService () {
        this.informationService = new this.hap.Service.AccessoryInformation()
        this.informationService.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Logic Switch')
            .setCharacteristic(this.hap.Characteristic.Model, 'Logic Switch')
            .setCharacteristic(this.hap.Characteristic.FirmwareRevision, require('./package.json').version)
            .setCharacteristic(this.hap.Characteristic.SerialNumber, this.hap.uuid.generate(this.name))
    }

    _configureSwitches ({ conditions }) {
        this.switchService.createSwitchesFromConfig(conditions)
    }

    _createServices () {
        this.switchService.createServices()
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
