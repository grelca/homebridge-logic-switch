import MockSwitch from './shared/mockSwitch'

const switches: MockSwitch[] = []
const mockAll = jest.fn(() => switches)

jest.mock('../src/switchStore', () => ({
  all: mockAll
}))

import DependencyChecker from '../src/dependencyChecker'
import mockLogger from './shared/mockLogger'

const checker = new DependencyChecker(mockLogger)

let switchCounter = 0
const mockSwitch = () => {
  const s = new MockSwitch()
  s.name = `${++switchCounter}-mock-switch`

  switches.push(s)
  return s
}

describe('circular dependency checker', () => {
  beforeEach(() => {
    while (switches.length > 0) switches.shift()
  })

  test('hasLoop() is false when no switches', () => {
    expect(checker.hasLoop()).toEqual(false)
  })

  test('hasLoop() is false when no switches are outputs', () => {
    mockSwitch()
    mockSwitch()

    expect(checker.hasLoop()).toEqual(false)
  })

  test('hasLoop() is false when one switch outputs to the other', () => {
    const s = mockSwitch()
    s.getOutputs = () => [mockSwitch()]

    expect(checker.hasLoop()).toEqual(false)
  })

  test('hasLoop() is true when switches output to each other', () => {
    const s1 = mockSwitch()
    const s2 = mockSwitch()

    s1.getOutputs = () => [s2]
    s2.getOutputs = () => [s1]

    expect(checker.hasLoop()).toEqual(true)
  })

  test('hasLoop() is true when one switch outputs to itself', () => {
    const s = mockSwitch()
    s.getOutputs = () => [s]

    expect(checker.hasLoop()).toEqual(true)
  })
})
