import { TypeormUtils } from "src/utils/typeorm.utils";

describe('TypeormUtils', () => {
  describe('textToStringArrayTransformer', () => {
    const { to, from } = TypeormUtils.textToStringArrayTransformer;

    it('should return a stringified array', () => {
      const input = ['hello', 'world'];
      const output = '["hello","world"]';

      expect(to(input)).toEqual(output);
    });

    it('should return a parsed array', () => {
      const input = '["hello","world"]';
      const output = ['hello', 'world'];

      expect(from(input)).toEqual(output);
    });
  });

  describe('textToNumberArrayTransformer', () => {
    const { to, from } = TypeormUtils.textToNumberArrayTransformer;

    it(' should return a stringified array of numbers', () => {
      const input = [1, 2, 3];
      const output = '[1,2,3]';

      expect(to(input)).toEqual(output);
    });

    it('should return a parsed array of numbers', () => {
      const input = '[1,2,3]';
      const output = [1, 2, 3];

      expect(from(input)).toEqual(output);
    });
  });
});
