import { ApiUtils } from 'src/utils/api.utils';
import { NumberUtils } from 'src/utils/number.utils';

describe('API helpers', () => {
  describe('Cleanup API response helper', () => {
    it('should remove key b (value is null)', () => {
      const testObject = {
        a: 'a',
        b: null,
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a' });
    });

    it('should remove key b (value is "")', () => {
      const testObject = {
        a: 'a',
        b: '',
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a' });
    });

    it('should remove key c and d (empty values)', () => {
      const testObject = {
        a: 'a',
        b: 'b',
        c: null,
        d: '',
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a', b: 'b' });
    });

    it('should remove empty keys for objects in array', () => {
      const arr = [];
      arr.push({ a: 'a', b: '' });
      arr.push({ c: 'c', d: null });

      ApiUtils.cleanupApiValueRecursively(arr);

      expect(arr[0]).toMatchObject({ a: 'a' });
      expect(arr[1]).toMatchObject({ c: 'c' });
    });

    it('should remove empty keys for nested objects', () => {
      const testObject = {
        a: {
          b: '',
          c: {
            d: null,
            e: 'e',
          },
        },
        f: null,
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: { c: { e: 'e' } } });
    });

    it('should remove array values within object', () => {
      const testObject = {
        a: [
          { b: 'b', c: null },
          { d: 'd', e: '' },
        ],
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: [{ b: 'b' }, { d: 'd' }] });
    });

    it('should remove empty array values within object', () => {
      const testObject = {
        a: [
          { b: 'b', c: [] },
          { d: 'd', e: [] },
        ],
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: [{ b: 'b' }, { d: 'd' }] });
    });

    it('should return same object', () => {
      const testObject = {
        a: 'a',
      };

      ApiUtils.cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject(testObject);
    });

    it('should return a denomination value', () => {
      expect(NumberUtils.denominateFloat('50000000100000000000')).toEqual(
        '50.000000100000000000',
      );
    });
  });
});
