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
            Object.values(this.inputServices),
            Object.values(this.outputServices)
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
        if(!Array.isArray(inputs)) {
            return []
        }

        // unique names which must be strings
        return [...new Set(inputs)].filter(name => typeof name === 'string')
    }

    _getInput(name) {
        return !!this.inputValues[name]
    }

    _setInput(name, value) {
        this.inputValues[name] = value
        this.storage.setItemSync(name, value)

        // TODO: update outputs
    }

    _initOutputSensors(outputs) {
        this._validOutputs(outputs).forEach(config => {
            // keep track of the output configs
            this.outputConfigs[config.name] = config

            // create sensor service
            const service = new this.Service.MotionSensor(config.name, config.name)
            service.getCharacteristic(this.Characteristic.MotionDetected)
                .onGet(async () => this._getOutput(config.name))

            this.outputServices[config.name] = service
        })
    }

    // TODO: add logs about failed validations
    _validOutputs(outputs) {
        // outputs must be an array
        if(!Array.isArray(outputs)) {
            return []
        }

        const outputNames = []
        return outputs.filter(config => {
            // unique output name, conditions must be an array
            if(outputNames.indexOf(config.name) !== -1 || !Array.isArray(config.conditions)) {
                return false
            }

            outputNames.push(config.name)

            return config.conditions.every(condition => {
                return condition.name in this.inputValues // valid input name
                    && (condition.value === true || condition.value === false) // valid input value
            })
        })
    }

    _getOutput(name) {
        const config = this.outputConfigs[name] || {}

        switch (config.gate) {
            case 'OR':
                return config.conditions.some(
                    inputConfig => this._getInput(inputConfig.name) === inputConfig.value
                )
            default: // default == AND
                return config.conditions.every(
                    inputConfig => this._getInput(inputConfig.name) === inputConfig.value
                )
        }
    }
}
