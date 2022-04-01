export { };
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStructure(keys: any): CustomMatcherResult;
      toHaveProperties(args:any[]): CustomMatcherResult;
    }
  }
}
