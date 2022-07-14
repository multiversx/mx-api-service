import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import '@elrondnetwork/erdnest/lib/utils/extensions/array.extensions';

describe('Array Extensions', () => {
  describe('Distinct', () => {
    it('String array', () => {
      expect(['hello', 'world'].distinct()).toEqual(['hello', 'world']);
      expect(['hello', 'hello', 'world'].distinct()).toEqual(['hello', 'world']);
      expect(['hello', 'hello', 'world', 'world'].distinct()).toEqual(['hello', 'world']);
      expect(['hello', 'world', 'hello', 'world'].distinct()).toEqual(['hello', 'world']);
    });

    it('Number array', () => {
      expect([1, 2, 3, 4].distinct()).toEqual([1, 2, 3, 4]);
      expect([1, 1, 2, 3, 4].distinct()).toEqual([1, 2, 3, 4]);
      expect([1, 2, 2, 3, 4].distinct()).toEqual([1, 2, 3, 4]);
      expect([1, 1, 2, 2, 3, 4].distinct()).toEqual([1, 2, 3, 4]);
      expect([1, 2, 3, 4, 1, 2, 3, 4].distinct()).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Distinct By', () => {
    it('Distinct by String', () => {
      expect([{ name: 'hello' }, { name: 'world' }].distinctBy(x => x.name)).toEqual([{ name: 'hello' }, { name: 'world' }]);
      expect([{ name: 'hello' }, { name: 'hello' }, { name: 'world' }].distinctBy(x => x.name)).toEqual([{ name: 'hello' }, { name: 'world' }]);
      expect([{ name: 'hello' }, { name: 'world' }, { name: 'world' }].distinctBy(x => x.name)).toEqual([{ name: 'hello' }, { name: 'world' }]);
      expect([{ name: 'hello' }, { name: 'world' }, { name: 'hello' }, { name: 'world' }].distinctBy(x => x.name)).toEqual([{ name: 'hello' }, { name: 'world' }]);

      expect([
        { name: 'hello', username: 'helloworld' },
        { name: 'hello', username: 'helloworld2' },
        { name: 'world', username: 'worldhello' },
        { name: 'world', username: 'worldhello2' },
      ].distinctBy(x => x.name))
        .toEqual([
          { name: 'hello', username: 'helloworld' },
          { name: 'world', username: 'worldhello' },
        ]);
    });

    it('Distinct by Number', () => {
      expect([{ id: 1 }, { id: 2 }].distinctBy(x => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
      expect([{ id: 1 }, { id: 1 }, { id: 2 }].distinctBy(x => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
      expect([{ id: 1 }, { id: 2 }, { id: 2 }].distinctBy(x => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
      expect([{ id: 1 }, { id: 1 }, { id: 2 }, { id: 2 }].distinctBy(x => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
      expect([{ id: 1 }, { id: 2 }, { id: 1 }, { id: 2 }].distinctBy(x => x.id)).toEqual([{ id: 1 }, { id: 2 }]);

      expect([
        { id: 1, username: 'one' },
        { id: 1, username: 'one2' },
        { id: 2, username: 'two' },
        { id: 2, username: 'two2' },
      ].distinctBy(x => x.id))
        .toEqual([
          { id: 1, username: 'one' },
          { id: 2, username: 'two' },
        ]);
    });
  });

  describe('Find Missing Elements', () => {
    expect([1, 2, 3, 4].findMissingElements([1, 2])).toEqual([3, 4]);
    expect([1, 2].findMissingElements([1, 2])).toEqual([]);
    expect([1, 2].findMissingElements([1, 2, 3, 4])).toEqual([]);
    expect([1, 2, 3, 4].findMissingElements([5, 6, 7, 8])).toEqual([1, 2, 3, 4]);
    expect([1, 2, 3, 4, 5, 6].findMissingElements([2, 4, 6])).toEqual([1, 3, 5]);
  });

  describe('Remove', () => {
    const array = ['a', 'b', 'c', 'd'];
    expect(array.remove('b')).toEqual(1);
    expect(array).toEqual(['a', 'c', 'd']);

    expect(array.remove('x')).toEqual(-1);
    expect(array).toEqual(['a', 'c', 'd']);
  });

  describe('First Or Undefined', () => {
    const array = [
      {
        a: 'a',
      },
      {
        a: 'b',
      },
      {
        b: 'b',
      },
      {
        c: 'c',
      },
    ];

    expect(array.firstOrUndefined((x) => x.a !== undefined)).toEqual({ a: 'a' });
    expect(array.firstOrUndefined((x) => x.a === 'b')).toEqual({ a: 'b' });
    expect(array.firstOrUndefined((x) => x.a === 'c')).toBeUndefined();
    expect(array.firstOrUndefined()).toEqual({
      a: 'a',
    });
  });

  describe('Select Many', () => {
    const array = [
      {
        a: 'a',
        pets: [
          'a', 'b',
        ],
      },
      {
        a: 'b',
        pets: [
          'c', 'd',
        ],
      },
      {
        b: 'b',
        pets: [
          'a', 'b',
        ],
      },
      {
        c: 'c',
        pets: [
          'c', 'd',
        ],
      },
    ];

    expect(array.selectMany((item) => item.pets)).toEqual(['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd']);
  });

  describe('Group By', () => {
    const transaction1: Transaction = new Transaction();
    transaction1.sender = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40';
    transaction1.receiver = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqaqqqqqqqqq9lllllsf3mp40';

    const transaction2: Transaction = new Transaction();
    transaction2.sender = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40';
    transaction2.receiver = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqaqqqqqqqqq9lllllsf3mp40';

    const transaction3: Transaction = new Transaction();
    transaction3.sender = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40';
    transaction3.receiver = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqaqqqqqqqqq9ldavllcf3mp40';

    const array = [transaction1, transaction2, transaction3];

    expect(array.groupBy((item) => item.sender)).toEqual({
      'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40': [transaction1, transaction2, transaction3],
    });

    expect(array.groupBy((item) => item.receiver)).toEqual({
      'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqaqqqqqqqqq9ldavllcf3mp40': [transaction3],
      'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqaqqqqqqqqq9lllllsf3mp40': [transaction1, transaction2],
    });
  });

  describe('Zip', () => {
    const keys = ['a', 'b', 'c', 'd'];
    const confirmations = [false, true, false, true];

    expect(keys.zip(confirmations, (first, second) => ({ key: first, confirmed: second }))).toEqual([
      {
        key: 'a',
        confirmed: false,
      },
      {
        key: 'b',
        confirmed: true,
      },
      {
        key: 'c',
        confirmed: false,
      },
      {
        key: 'd',
        confirmed: true,
      },
    ]);
  });

  describe('Sorted', () => {
    it('simple', () => {
      const actual = [2, 1, 3].sorted();
      const expected = [1, 2, 3];

      expect(actual).toEqual(expected);
    });

    it('complex', () => {
      const actual = [
        { id: 2 },
        { id: 1 },
        { id: 3 },
      ].sorted(x => x.id);

      const expected = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];

      expect(actual).toEqual(expected);
    });

    it('multiple criteria', () => {
      const actual = [
        { a: 2, b: 1 },
        { a: 1, b: 2 },
        { a: 1, b: 1 },
      ].sorted(x => x.a, x => x.b);

      const expected = [
        { a: 1, b: 1 },
        { a: 1, b: 2 },
        { a: 2, b: 1 },
      ];

      expect(actual).toEqual(expected);
    });
  });

  describe('Sorted descending', () => {
    it('simple', () => {
      const actual = [2, 1, 3].sortedDescending();
      const expected = [3, 2, 1];

      expect(actual).toEqual(expected);
    });

    it('complex', () => {
      const actual = [
        { id: 2 },
        { id: 1 },
        { id: 3 },
      ].sortedDescending(x => x.id);

      const expected = [
        { id: 3 },
        { id: 2 },
        { id: 1 },
      ];

      expect(actual).toEqual(expected);
    });
  });
});
