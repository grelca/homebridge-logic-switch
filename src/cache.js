const nodePersist = require('node-persist')

class Cache {
  constructor (directory, prefix = '') {
    this.storage = nodePersist.create({
      dir: directory,
      forgiveParseErrors: true
    })

    this.storage.initSync()
    this.prefix = prefix
  }

  get (key) {
    return this.storage.getItemSync(this.prefix + key)
  }

  set (key, value) {
    return this.storage.setItemSync(this.prefix + key, value)
  }

  clear () {
    return this.storage.clearSync()
  }
}

module.exports = Cache
