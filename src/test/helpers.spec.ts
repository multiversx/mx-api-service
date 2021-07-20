import { cleanupApiValueRecursively } from "src/helpers/helpers";

describe('API helpers', () => {
  describe('Cleanup API response helper', () => {
    it('should remove key b (value is null)', () => {
      let testObject: any = {
        a: 'a',
        b: null,
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a' });
    });

    it('should remove key b (value is "")', () => {
      let testObject: any = {
        a: 'a',
        b: '',
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a' });
    });

    it('should remove key c and d (empty values)', () => {
      let testObject: any = {
        a: 'a',
        b: 'b',
        c: null,
        d: '',
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: 'a', b: 'b' });
    });

    it('should remove empty keys for objects in array', () => {
      let arr = [];
      arr.push({ a: 'a', b: '' });
      arr.push({ c: 'c', d: null });

      cleanupApiValueRecursively(arr);

      expect(arr[0]).toMatchObject({ a: 'a' });
      expect(arr[1]).toMatchObject({ c: 'c' });
    });

    it('should remove empty keys for nested objects', () => {
      let testObject: any = {
        a: {
          b: '',
          c: {
            d: null,
            e: 'e'
          }
        },
        f: null
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a: { c: { e: 'e' }}});
    });

    it('should remove array values within object', () => {
      let testObject: any = {
        a: [ { b: 'b', c: null }, { d: 'd', e: '' }]
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a:[ { b: 'b' }, { d: 'd' } ] });
    });

    it('should remove empty array values within object', () => {
      let testObject: any = {
        a: [ { b: 'b', c: [] }, { d: 'd', e: [] }]
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject({ a:[ { b: 'b' }, { d: 'd' } ] });
    })

    it('should return same object', () => {
      let testObject: any = {
        a: 'a'
      }

      cleanupApiValueRecursively(testObject);

      expect(testObject).toMatchObject(testObject);
    })
  });
});