import pick from 'lodash/pick'

import type ISwitchAccessory from './types/switchAccessory'

export default class SwitchStores {
  static switches: Record<string, ISwitchAccessory> = {}

  static getOne (name: string): ISwitchAccessory {
    return this.switches[name]
  }

  static getList (...names: string[]): ISwitchAccessory[] {
    return Object.values(pick(this.switches, names))
  }

  static all (): ISwitchAccessory[] {
    return Object.values(this.switches)
  }

  static exists (name: string): boolean {
    return Boolean(this.switches[name])
  }

  static add (s: ISwitchAccessory): void {
    this.switches[s.name] = s
  }
}
