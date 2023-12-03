import includes from 'lodash/includes'
import some from 'lodash/some'

import { type Logging } from 'homebridge'

import type IDependencyChecker from './types/dependencyChecker'
import type ISwitchAccessory from './types/switchAccessory'
import SwitchStore from './switchStore'

// utility class to make sure there are no circular dependencies
export default class DependencyChecker implements IDependencyChecker {
  private readonly logger: Logging

  constructor (logger: Logging) {
    this.logger = logger
  }

  hasLoop (): boolean {
    return some(SwitchStore.all(), s => this.hasLoopRecursive(s))
  }

  private hasLoopRecursive (s: ISwitchAccessory, inputs: string[] = []): boolean {
    this.logger.debug('checking for loops', s.name, inputs)

    if (includes(inputs, s.name)) {
      this.logger.error('logic loop detected!', s.name, inputs)
      return true
    }

    const outputs = s.getOutputs()
    if (outputs.length === 0) {
      return false
    }

    inputs.push(s.name)
    return some(outputs, output => this.hasLoopRecursive(output, inputs))
  }
}
