expect.extend({
    toHaveStructure(received: any, keys: string[]) {
        const objectSortedKeys = JSON.stringify(Object.keys(received).sort());
        const expectedKeys = JSON.stringify(keys.sort());

        const pass = objectSortedKeys === expectedKeys;
        if (pass) {
            return {
                pass: true,
                message: () => `expected ${objectSortedKeys} not to have structure ${expectedKeys} `,
            };
        }
        else {
            return {
                pass: false,
                message: () => `expected ${objectSortedKeys} to have structure ${expectedKeys} `,
            };
        }
    },

    toHaveProperties(received: any, args: any[]) {
        const receivedProperties = Object.getOwnPropertyNames(received);
        const pass = !args.some(val => receivedProperties.indexOf(val) === -1);
        if (pass) {
            return {
                message: () => `expected ${received} not to have properties of ${args}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to have properties of ${args}`,
                pass: false,
            };
        }
    },
});

interface Matchers<R> {
    toHaveStructure(received: any, keys: string[]): R;
    toHaveProperties(received: any, args: any[]): R;
}
