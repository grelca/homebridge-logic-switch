export default interface ICache {
  get: (name: string) => boolean
  set: (name: string, value: boolean) => void
}
