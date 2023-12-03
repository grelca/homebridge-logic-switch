import nodePersist from 'node-persist'

import type ICache from './types/cache'

export default class Cache implements ICache {
  storage: any
  prefix: string

  constructor (directory: string, prefix = '') {
    this.storage = nodePersist.create({
      dir: directory,
      forgiveParseErrors: true
    })

    this.storage.initSync()
    this.prefix = prefix
  }

  get (key: string): boolean {
    return this.storage.getItemSync(this.prefix + key)
  }

  set (key: string, value: boolean): void {
    this.storage.setItemSync(this.prefix + key, value)
  }

  clear (): void {
    this.storage.clearSync()
  }
}
