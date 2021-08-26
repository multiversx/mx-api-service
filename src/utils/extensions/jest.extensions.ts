expect.extend({
  toHaveStructure(received: any, keys: string[]) {
      const objectSortedKeys = JSON.stringify(Object.keys(received).sort());
      const expectedKeys = JSON.stringify(keys.sort());

      const pass = objectSortedKeys === expectedKeys;
      if (pass) {
          return {
              pass: true,
              message: () => `expected ${objectSortedKeys} not to have structure ${expectedKeys} `,
          }
      } 
      else {
          return {
              pass: false,
              message: () => `expected ${objectSortedKeys} to have structure ${expectedKeys} `,
          }
      }
  },
});

declare namespace jest {
  interface Matchers<R> {
    toHaveStructure(received: any, keys: string[]): R;
  }
}