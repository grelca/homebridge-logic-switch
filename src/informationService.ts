import { type HAP, type Service } from 'homebridge'

import { version } from '../package.json'

export default class InformationService {
  hap: HAP
  name: string

  service?: Service

  constructor (hap: HAP, name: string) {
    this.hap = hap
    this.name = name
  }

  getService (): Service {
    if (this.service === undefined) {
      this._createService()
    }

    // @ts-expect-error this.service cannot be undefined here
    return this.service
  }

  _createService (): void {
    this.service = new this.hap.Service.AccessoryInformation()
    this.service.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Logic Switch')
      .setCharacteristic(this.hap.Characteristic.Model, 'Logic Switch')
      .setCharacteristic(this.hap.Characteristic.FirmwareRevision, version)
      .setCharacteristic(this.hap.Characteristic.SerialNumber, this.hap.uuid.generate(this.name))
  }
}
