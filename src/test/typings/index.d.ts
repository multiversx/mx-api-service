export { };
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStructure(keys: any): CustomMatcherResult;
    }
  }
}
