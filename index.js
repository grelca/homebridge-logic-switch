const each = require('lodash/each')
const get = require('lodash/get')
const map = require('lodash/map')
const upperCase = require('lodash/upperCase')

const Cache = require('./src/cache')
const DependencyChecker = require('./src/dependencyChecker')
const Switch = require('./src/switch')

module.exports = function (homebridge) {
    homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
    switches = {}
    hasLoop = false

    constructor (logger, config, homebridge) {
        this.logger = logger

        this.hap = homebridge.hap
        this.name = config.name

        // TODO: make whether this is stateful or not configurable
        const dir = homebridge.user.persistPath();
        this.cache = new Cache(dir, this.name)

        const { conditions } = config
        this._initInformationService()
        this._configureSwitches(conditions)
        this._createServices()
        this._detectLoops()
        this._initOutputValues()
    }

    getServices () {
        // TODO: make this smarter, disable only the outputs with invalid inputs
        if (this.hasLoop) {
            return []
        }

        const services = map(this.switches, 'service')
        this.logger.debug('num services', services.length)

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

    _configureSwitches (conditions) {
        each(conditions, condition => {
            const output = get(condition, 'output')
            const inputs = get(condition, 'inputs')

            const inputSwitches = this._createSwitches(inputs)
            const outputSwitch = this._createSwitches([output])[0]

            const gate = get(condition, 'gate')
            outputSwitch.gateType = upperCase(gate)

            outputSwitch.inputs = inputSwitches
            each(inputSwitches, input => input.outputs.push(outputSwitch))
        })
    }

    _createSwitches (names) {
        return map(names, name => {
            if (!this.switches[name]) {
                this.switches[name] = new Switch(name, this.cache, this.logger)
            }

            return this.switches[name]
        })
    }

    _createServices () {
        each(this.switches, s => s.configureService(this.hap))
    }

    _detectLoops () {
        const checker = new DependencyChecker(this.switches, this.logger)
        this.hasLoop = checker.hasLoop()
    }

    // TODO: this could be made more efficient
    _initOutputValues () {
        if (this.hasLoop) {
            return
        }

        each(this.switches, input => each(input.outputs, output => output.recalculate()))
    }
}
