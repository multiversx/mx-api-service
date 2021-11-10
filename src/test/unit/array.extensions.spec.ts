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
});