import '../../utils/extensions/array.extensions';

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
      ])
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
      ])
    });
  });

  describe('Find Missing Elements', () => {
    expect([1,2,3,4].findMissingElements([1, 2])).toEqual([3, 4]);
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
        a: 'a'
      },
      {
        a: 'b'
      },
      {
        b: 'b'
      },
      {
        c: 'c'
      },
    ];

    expect(array.firstOrUndefined((x) => x.a !== undefined)).toEqual({ a: 'a' });
    expect(array.firstOrUndefined((x) => x.a === 'b')).toEqual({ a: 'b' });
    expect(array.firstOrUndefined((x) => x.a === 'c')).toBeUndefined();
    expect(array.firstOrUndefined()).toEqual({
      a: 'a'
    })
  });

  describe('Select Many', () => {
    const array = [
      {
        a: 'a',
        pets: [
          'a', 'b'
        ]
      },
      {
        a: 'b',
        pets: [
          'c', 'd'
        ]
      },
      {
        b: 'b',
        pets: [
          'a', 'b'
        ]
      },
      {
        c: 'c',
        pets: [
          'c', 'd'
        ]
      },
    ];

    expect(array.selectMany((item) => item.pets)).toEqual(['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd']);
  });

  describe('Group By', () => {
    const array = [
      {
        a: 'a',
        pets: [
          'a', 'b'
        ]
      },
      {
        a: 'b',
        pets: [
          'c', 'd'
        ]
      },
      {
        b: 'b',
        pets: [
          'a', 'b'
        ]
      },
      {
        c: 'c',
        pets: [
          'c', 'd'
        ]
      },
    ]

    expect(array.groupBy((item) => item.a)).toEqual({ 
    a: [{
      a: 'a',
      pets: [
        'a', 'b'
      ]
    }],
    b: [{
        a: 'b',
        pets: [
          'c', 'd'
      ]
    }],
    undefined: [
      {
        b: 'b',
        pets: [
          'a', 'b'
        ]
      },
      {
        c: 'c',
        pets: [
          'c', 'd'
        ]
      },
    ]
    });
  });
});