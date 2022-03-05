// TODO: only import what we need
const _ = require('lodash')

module.exports = function (homebridge) {
    homebridge.registerAccessory('homebridge-logic-switch', 'LogicSwitch', LogicSwitch)
}

class LogicSwitch {
    constructor(logger, config, homebridge) {
        this.logger = logger

        this.Service = homebridge.hap.Service
        this.Characteristic = homebridge.hap.Characteristic
        this.uuid = homebridge.hap.uuid

        // TODO: make stateful an option
        const dir = homebridge.user.persistPath();
        this.storage = require('node-persist');
        this.storage.initSync({ dir, forgiveParseErrors: true });

        this.inputServices = {}
        this.inputValues = {}
        this.outputServices = {}
        this.outputConfigs = {}

        const { name, inputs, outputs } = config
        this._initInformationService(name)
        this._initInputSwitches(inputs)
        this._initOutputSensors(outputs)
    }

    getServices() {
        const services = [
            this.informationService,
            _.values(this.inputServices),
            _.values(this.outputServices)
        ].flat()

        if (services.length === 1) {
            // don't return information service without any actual accessories
            return []
        }

        return services
    }

    _initInformationService(name) {
        this.logger.debug(this.uuid.generate(name))
        this.informationService = new this.Service.AccessoryInformation()
        this.informationService.setCharacteristic(this.Characteristic.Manufacturer, 'Logic Switch')
            .setCharacteristic(this.Characteristic.Model, 'Logic Switch')
            .setCharacteristic(this.Characteristic.FirmwareRevision, '0.0.0') // TODO: use version from package.json
            .setCharacteristic(this.Characteristic.SerialNumber, this.uuid.generate(name))
    }

    _initInputSwitches(inputs) {
        this._validInputs(inputs).forEach(name => {
            // set initial switch value
            this.inputValues[name] = this.storage.getItemSync(name)

            // create switch service
            this.logger.debug(this.uuid.generate(name))
            const service = new this.Service.Switch(name, name)

            // set handlers
            service.getCharacteristic(this.Characteristic.On)
                .onGet(async () => this._getInput(name))
                .onSet(async (value) => this._setInput(name, value))

            this.inputServices[name] = service
        })
    }

    // TODO: add logs about failed validations
    _validInputs(inputs) {
        // inputs must be an array
        if(!_.isArray(inputs)) {
            return []
        }

        // unique names which must be strings
        return _.uniq(inputs).filter(name => typeof name === 'string')
    }

    _getInput(name) {
        return !!_.get(this.inputValues, name, false)
    }

    _setInput(name, value) {
        this.inputValues[name] = value
        this.storage.setItemSync(name, value)

        // TODO: only update outputs affected by this input
        this._updateOutputs(_.keys(this.outputServices))
            .catch(err => this.logger.error('a problem occurred updating outputs', err))
    }

    _initOutputSensors(outputs) {
        this._validOutputs(outputs).forEach(config => {
            // keep track of the output configs
            this.outputConfigs[config.name] = config

            // create sensor service
            const service = new this.Service.MotionSensor(config.name, config.name)
            service.getCharacteristic(this.Characteristic.MotionDetected)
                .onGet(async () => this._calcOutput(config.name))

            this.outputServices[config.name] = service
        })
    }

    // TODO: add logs about failed validations
    _validOutputs(outputs) {
        // outputs must be an array
        if(!_.isArray(outputs)) {
            return []
        }

        const outputNames = new Set()
        return outputs.filter(config => {
            // unique output name
            if(outputNames.has(config.name)) {
                return false
            }

            outputNames.add(config.name)

            // conditions must be an array
            const conditions = _.get(config, 'conditions')
            if(!_.isArray(conditions)) {
                return false
            }

            return conditions.every(condition => {
                return condition.name in this.inputValues // valid input name
                    && (condition.value === true || condition.value === false) // valid input value
            })
        })
    }

    _calcOutput(name) {
        const config = _.get(this.outputConfigs, name, {})
        const { gate, conditions } = config

        const map = {
            'OR': _.some,
            'AND': _.every
        }

        const method = _.get(map, gate, _.every) // default behavior is AND
        return method(
            conditions,
            inputConfig => this._getInput(inputConfig.name) === inputConfig.value
        )
    }

    async _updateOutputs(names) {
        names.forEach(name => {
            const service = this.outputServices[name]
            service.getCharacteristic(this.Characteristic.MotionDetected).updateValue(this._calcOutput(name))
        })
    }
}
