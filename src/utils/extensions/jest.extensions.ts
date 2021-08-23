expect.extend({
  toHaveStructure(received: any, keys: string[]) {
      const objectSortedKeys = JSON.stringify(Object.keys(received).sort());
      const expectedKeys = JSON.stringify(keys.sort());

      const pass = objectSortedKeys === expectedKeys;
      if (pass) {
          return {
              pass: true,
              message: () => `expected ${Object.keys(received)} not to be a valid ${keys} `,
          }
      } 
      else {
          return {
              pass: false,
              message: () => `expected ${Object.keys(received)} to be a valid ${keys} `,
          }
      }
  },
});

declare namespace jest {
  interface Matchers<R> {
    toHaveStructure(received: any, keys: string[]): R;
  }
}