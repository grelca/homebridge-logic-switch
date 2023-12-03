export default interface IDependencyChecker {
  hasLoop: () => boolean
}
