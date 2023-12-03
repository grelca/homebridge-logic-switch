class InformationService {
  service = null

  constructor (hap, name) {
    this.hap = hap
    this.name = name
  }

  getService () {
    if (this.service === null) {
      this._createService()
    }

    return this.service
  }

  _createService () {
    this.service = new this.hap.Service.AccessoryInformation()
    this.service.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Logic Switch')
      .setCharacteristic(this.hap.Characteristic.Model, 'Logic Switch')
      .setCharacteristic(this.hap.Characteristic.FirmwareRevision, require('../package.json').version)
      .setCharacteristic(this.hap.Characteristic.SerialNumber, this.hap.uuid.generate(this.name))
  }
}

module.exports = InformationService
