import ISwitchAccessory from '../../src/types/switchAccessory'

export default class MockSwitch implements ISwitchAccessory {
  name = 'mock-switch'
  value = true

  getInputs: () => ISwitchAccessory[] = jest.fn(() => [])
  getOutputs: () => ISwitchAccessory[] = jest.fn(() => [])

  updateOutputs = jest.fn()
  updateInputs = jest.fn()

  recalculate = jest.fn()

  createHAPService = jest.fn()
}
