class SwitchStore {
  static switches = {}

  static get (name) {
    return this.switches[name]
  }

  static all () {
    return this.switches
  }

  static exists (name) {
    return !!this.switches[name]
  }

  static add (name, s) {
    this.switches[name] = s
  }
}

module.exports = SwitchStore
