const pick = require('lodash/pick')

class SwitchStore {
  static switches = {}

  static getOne (name) {
    return this.switches[name]
  }

  static getList (...names) {
    return Object.values(pick(this.switches, names))
  }

  static all () {
    return Object.values(this.switches)
  }

  static exists (name) {
    return !!this.switches[name]
  }

  static add (name, s) {
    this.switches[name] = s
  }
}

module.exports = SwitchStore
