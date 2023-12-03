let relatedSwitches = [jest.fn()]
const mockGetList = jest.fn(() => relatedSwitches)

jest.mock('../src/switchStore', () => ({
  getList: mockGetList
}))

const SwitchAccessory = require('../src/switchAccessory')

const SWITCH_NAME = 'switch-name'
const SWITCH_VALUE = 'switch-value'
const mockCache = {
  set: jest.fn()
}
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn()
}

const s = new SwitchAccessory(SWITCH_NAME, SWITCH_VALUE, mockCache, mockLogger)

describe('switch accessory', () => {
  beforeEach(() => {
    // reset switch values for each test
    s.value = SWITCH_VALUE
    s.inputs = []
    s.outputs = []
    s.logicGate = 'AND'
  })

  test('getInputs() gets list of switches from switch store', () => {
    s.inputs = ['foo', 'bar']

    expect(s.getInputs()).toEqual(relatedSwitches)
    expect(mockGetList).toHaveBeenCalledWith('foo', 'bar')
  })

  test('getOutputs() gets list of switches from switch store', () => {
    s.outputs = ['baz', 'qux']

    expect(s.getOutputs()).toEqual(relatedSwitches)
    expect(mockGetList).toHaveBeenCalledWith('baz', 'qux')
  })

  test('isInput() returns true when outputs are configured', () => {
    s.outputs = ['foo', 'bar']
    expect(s.isInput()).toEqual(true)
  })

  test('isInput() returns false when no outputs are configured', () => {
    expect(s.isInput()).toEqual(false)
  })

  test('isOutput() returns true when outputs are configured', () => {
    s.inputs = ['foo', 'bar']
    expect(s.isOutput()).toEqual(true)
  })

  test('isOutput() returns false when no outputs are configured', () => {
    expect(s.isOutput()).toEqual(false)
  })

  // it's not a valid use case to define the same output twice
  test('updateInputs() replaces input list and logic gate', () => {
    s.inputs = ['foo', 'bar']
    s.updateInputs(['baz', 'qux'], 'not')

    expect(s.inputs).toEqual(['baz', 'qux'])
    expect(s.logicGate).toEqual('NOT')
  })

  test('updateOutputs() appends to output list', () => {
    s.outputs = ['foo']
    s.updateOutputs('bar')

    expect(s.outputs).toEqual(['foo', 'bar'])
  })

  describe('createHAPService()', () => {
    const mockOnGet = jest.fn()
    const mockOnSet = jest.fn()
    const mockCharacteristic = {
      onGet: mockOnGet,
      onSet: mockOnSet
    }

    const mockGetCharacteristic = jest.fn(() => mockCharacteristic)
    const mockService = {
      getCharacteristic: mockGetCharacteristic
    }

    test('createHAPService() creates a motion sensor for an output switch', () => {
      s.inputs = ['foo']

      const mockMotionSensor = jest.fn(() => mockService)
      const mockMotionDetected = jest.fn()

      const hap = {
        Service: {
          MotionSensor: mockMotionSensor
        },
        Characteristic: {
          MotionDetected: mockMotionDetected
        }
      }

      s.createHAPService(hap)
      expect(s.service).toEqual(mockService)
      expect(s.characteristic).toEqual(mockCharacteristic)

      expect(mockMotionSensor).toHaveBeenCalledWith(SWITCH_NAME, SWITCH_NAME)
      expect(mockGetCharacteristic).toHaveBeenCalledWith(mockMotionDetected)
      expect(mockOnGet).toHaveBeenCalled()
      expect(mockOnSet).not.toHaveBeenCalled()
    })

    test('createHAPService() creates a toggle switch for an input-only switch', () => {
      const mockToggleSwitch = jest.fn(() => mockService)
      const mockOn = jest.fn()

      const hap = {
        Service: {
          Switch: mockToggleSwitch
        },
        Characteristic: {
          On: mockOn
        }
      }

      s.createHAPService(hap)
      expect(s.service).toEqual(mockService)
      expect(s.characteristic).toEqual(mockCharacteristic)

      expect(mockToggleSwitch).toHaveBeenCalledWith(SWITCH_NAME, SWITCH_NAME)
      expect(mockGetCharacteristic).toHaveBeenCalledWith(mockOn)
      expect(mockOnGet).toHaveBeenCalled()
      expect(mockOnSet).toHaveBeenCalled()
    })
  })

  describe('recalculate()', () => {
    const mockUpdateValue = jest.fn()

    beforeEach(() => {
      s.inputs = ['foo']
      s.characteristic = {
        updateValue: mockUpdateValue
      }
    })

    const configureRelatedSwitches = (...values) => {
      relatedSwitches = values.map(value => ({
        value
      }))
    }

    test('recalculate() exits if not an output switch', () => {
      s.inputs = []
      s.recalculate()

      expect(mockUpdateValue).not.toHaveBeenCalled()
    })

    test('recalculate() exits if value is not changed from true', () => {
      s.value = true
      configureRelatedSwitches(true)

      s.recalculate()

      expect(mockUpdateValue).not.toHaveBeenCalled()
    })

    test('recalculate() exits if value is not changed from true', () => {
      s.value = false
      configureRelatedSwitches(false)

      s.recalculate()

      expect(mockUpdateValue).not.toHaveBeenCalled()
    })

    describe('AND logic gate', () => {
      test('recalculate() enables switch when all inputs are on', () => {
        s.value = false
        configureRelatedSwitches(true, true, true)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(true)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, true)
      })

      test('recalculate() disables switch when all inputs are off', () => {
        s.value = true
        configureRelatedSwitches(false, false, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })

      test('recalculate() disables switch when some inputs are off', () => {
        s.value = true
        configureRelatedSwitches(true, true, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })
    })

    describe('invalid logic gate value (falls back to AND)', () => {
      beforeEach(() => {
        s.logicGate = 'foo'
      })

      test('recalculate() enables switch when all inputs are on', () => {
        s.value = false
        configureRelatedSwitches(true, true, true)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(true)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, true)
      })

      test('recalculate() disables switch when all inputs are off', () => {
        s.value = true
        configureRelatedSwitches(false, false, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })

      test('recalculate() disables switch when some inputs are off', () => {
        s.value = true
        configureRelatedSwitches(true, true, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })
    })

    describe('OR logic gate', () => {
      beforeEach(() => {
        s.logicGate = 'OR'
      })

      test('recalculate() enables switch when all inputs are on', () => {
        s.value = false
        configureRelatedSwitches(true, true, true)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(true)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, true)
      })

      test('recalculate() disables switch when all inputs are off', () => {
        s.value = true
        configureRelatedSwitches(false, false, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })

      test('recalculate() enables switch when some inputs are on', () => {
        s.value = false
        configureRelatedSwitches(true, true, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(true)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, true)
      })
    })

    describe('NOT logic gate', () => {
      beforeEach(() => {
        s.logicGate = 'NOT'
      })

      test('recalculate() disables switch when all inputs are on', () => {
        s.value = true
        configureRelatedSwitches(true, true, true)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })

      test('recalculate() enables switch when all inputs are off', () => {
        s.value = false
        configureRelatedSwitches(false, false, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(true)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, true)
      })

      test('recalculate() disables switch when some inputs are on', () => {
        s.value = true
        configureRelatedSwitches(true, true, false)

        s.recalculate()

        expect(mockUpdateValue).toHaveBeenCalledWith(false)
        expect(mockCache.set).toHaveBeenCalledWith(SWITCH_NAME, false)
      })
    })

    test.todo('recalculate outputs when changed')
  })
})
