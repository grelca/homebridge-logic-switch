const nodePersist = require('node-persist')

class Cache {
  constructor (directory) {
    this.storage = nodePersist.create({
      dir: directory,
      forgiveParseErrors: true
    })

    this.storage.initSync()
  }

  get (key) {
    return this.storage.getItemSync(key)
  }

  set (key, value) {
    return this.storage.setItemSync(key, value)
  }
}

module.exports = Cache
