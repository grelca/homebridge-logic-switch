export default interface ISwitchAccessory {
  name: string
  value: boolean

  getOutputs: () => ISwitchAccessory[]

  updateOutputs: (output: string) => void
  updateInputs: (inputs: string[], gate: string) => void

  recalculate: () => void

  createHAPService: any
}
