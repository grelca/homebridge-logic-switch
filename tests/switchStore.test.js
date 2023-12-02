const SwitchAccessory = require('../src/switchAccessory');
const SwitchStore = require('../src/switchStore');

const switch1 = new SwitchAccessory()
const switch2 = new SwitchAccessory()

describe('switch store', () => {
  beforeEach(() => {
    SwitchStore.switches = {
      foo: switch1,
      bar: switch2
    }
  })

  test('when no switches, all() returns empty array', () => {
    SwitchStore.switches = {}
    expect(SwitchStore.all()).toEqual([])
  })

  test('when switches, all() returns all switches', () => {
    expect(SwitchStore.all()).toEqual([switch1, switch2])
  })

  test('when matching switch, getOne() returns switch', () => {
    expect(SwitchStore.getOne('foo')).toEqual(switch1)
  })

  test('when different switch, getOne() returns nothing', () => {
    expect(SwitchStore.getOne('baz')).toEqual(undefined)
  })

  test('when matching switch, getList() returns switch', () => {
    expect(SwitchStore.getList('foo')).toEqual([switch1])
  })

  test('when matching switches, getList() returns array of switches', () => {
    expect(SwitchStore.getList('foo', 'bar')).toEqual([switch1, switch2])
  })

  test('when some matching switches, getList() returns them', () => {
    expect(SwitchStore.getList('foo', 'baz')).toEqual([switch1])
  })

  test('when no matching switches, getList() returns empty array', () => {
    expect(SwitchStore.getList('baz', 'qux')).toEqual([])
  })

  test('when matching switch, exists() returns true', () => {
    expect(SwitchStore.exists('foo')).toEqual(true)
  })

  test('when different switch, exists() returns false', () => {
    expect(SwitchStore.exists('baz')).toEqual(false)
  })
});
