const each = require('lodash/each')
const every = require('lodash/every')
const get = require('lodash/get')
const includes = require('lodash/includes')
const intersection = require('lodash/intersection')
const map = require('lodash/map')
const pick = require('lodash/pick')
const some = require('lodash/some')
const uniq = require('lodash/uniq')
const upperCase = require('lodash/upperCase')

module.exports = function (homebridge) {
    homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

// TODO: support more logic gates?
const LOGIC_GATES = {
    AND: every,
    OR: some,
    NOT: (inputs, callback) => !some(inputs, callback)
}

class LogicSwitch {
    switches = {}
    hasLoop = false

    constructor (logger, config, homebridge) {
        this.logger = logger

        this.Service = homebridge.hap.Service
        this.Characteristic = homebridge.hap.Characteristic
        this.uuid = homebridge.hap.uuid

        // TODO: make whether this is stateful or not configurable
        const dir = homebridge.user.persistPath();
        this.storage = require('node-persist');
        this.storage.initSync({ dir, forgiveParseErrors: true });

        this.name = config.name

        const { switches, conditions } = config
        this._initInformationService()
        this._initSwitches(switches)
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
        this.informationService = new this.Service.AccessoryInformation()
        this.informationService.setCharacteristic(this.Characteristic.Manufacturer, 'Logic Switch')
            .setCharacteristic(this.Characteristic.Model, 'Logic Switch')
            .setCharacteristic(this.Characteristic.FirmwareRevision, require('../package.json').version)
            .setCharacteristic(this.Characteristic.SerialNumber, this.uuid.generate(this.name))
    }

    _initSwitches (switches) {
        // validate unique switch names
        const uniqueSwitches = uniq(switches)
        if (uniqueSwitches.length !== switches.length) {
            this.logger.warn('please ensure switch names are unique')
        }

        uniqueSwitches.forEach(name => {
            const storedValue = !!this.storage.getItemSync(this.name + name)

            this.switches[name] = {
                name: name,
                value: storedValue,
                outputs: []
            }
        })
    }

    _configureSwitches (conditions) {
        each(conditions, condition => {
            const output = get(condition, 'output')
            if (!this.switches[output]) {
                return this.logger.error(`invalid output: no configured ${output} switch`)
            }

            const gate = get(condition, 'gate')
            this.switches[output].gate = upperCase(gate)

            const inputs = get(condition, 'inputs')
            const validInputs = intersection(inputs, Object.keys(this.switches))
            this.switches[output].inputs = validInputs

            validInputs.forEach(input => this.switches[input].outputs.push(output))
        })
    }

    _createServices () {
        each(this.switches, s => {
            if (s.inputs) {
                s.service = this._createOutputService(s.name)
            } else {
                s.service = this._createInputService(s.name)
            }
        })
    }

    _createInputService (name) {
        const service = new this.Service.Switch(name, name)
        service.getCharacteristic(this.Characteristic.On)
            .onGet(async () => this._getValue(name))
            .onSet(async (value) => this._setValue(name, value))

        return service
    }

    _createOutputService (name) {
        const service = new this.Service.MotionSensor(name, name)
        service.getCharacteristic(this.Characteristic.MotionDetected)
            .onGet(async () => this._getValue(name))

        return service
    }

    _getValue (name) {
        return !!this.switches[name].value
    }

    _setValue (name, value) {
        this.logger.info(`setting ${name} to ${value}`)

        this.switches[name].value = value
        this.storage.setItemSync(this.name + name, value)

        this._updateOutputs(name)
    }

    _updateOutputs (name) {
        const { outputs } = this.switches[name]
        outputs.forEach(output => {
            const newValue = this._calcOutput(output)
            if (!!newValue === !!this._getValue(output)) {
                return this.logger.debug(`${output} value not changed`)
            }

            const { service } = this.switches[output]
            service.getCharacteristic(this.Characteristic.MotionDetected).updateValue(newValue)

            this._setValue(output, newValue)
        })
    }

    _calcOutput (name) {
        const { gate, inputs } = this.switches[name]

        // get comparison method, default is AND
        const method = get(LOGIC_GATES, gate, every)

        return method(
            pick(this.switches, inputs),
            input => !!input.value
        )
    }

    _detectLoops () {
        this.hasLoop = some(this.switches, s => this._hasLoop(s, []))
    }

    // recursively look for logic loops
    _hasLoop (s, inputs) {
        this.logger.debug('checking for loops', s.name, inputs)

        if (includes(inputs, s.name)) {
            this.logger.error('logic loop detected!', s.name, inputs)
            return true
        }

        if (s.outputs.length === 0) {
            return false
        }

        inputs.push(s.name)
        return some(s.outputs, output => this._hasLoop(this.switches[output], inputs))
    }

    // TODO: this could be made more efficient
    _initOutputValues () {
        if (this.hasLoop) {
            return
        }

        Object.keys(this.switches).forEach(this._updateOutputs.bind(this))
    }
}
