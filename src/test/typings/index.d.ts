export {};
declare global {
  namespace jest {
    interface Matchers<R> {
        toBeAccount(): CustomMatcherResult;
    }
  }
}