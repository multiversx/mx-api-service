import { SearchAfterUtils } from 'src/utils/search.after.utils';

describe('SearchAfterUtils', () => {
  describe('sortKeepingSearchAfterPositions', () => {
    it('keeps every searchAfter on its original position', () => {
      const items = [
        { id: 'a', rank: 1, searchAfter: 'cursor-1' },
        { id: 'b', rank: 3, searchAfter: 'cursor-2' },
        { id: 'c', rank: 2, searchAfter: 'cursor-3' },
      ];

      const sorted = SearchAfterUtils.sortKeepingSearchAfterPositions(items, list => [...list].sort((a, b) => b.rank - a.rank));

      expect(sorted.map(item => item.id)).toEqual(['b', 'c', 'a']);
      expect(sorted.map(item => item.searchAfter)).toEqual(['cursor-1', 'cursor-2', 'cursor-3']);
    });

    it('leaves items without searchAfter untouched', () => {
      const items: { id: string, rank: number, searchAfter?: string }[] = [{ id: 'b', rank: 2 }, { id: 'a', rank: 1 }];

      const sorted = SearchAfterUtils.sortKeepingSearchAfterPositions(items, list => [...list].sort((a, b) => a.rank - b.rank));

      expect(sorted.map(item => item.id)).toEqual(['a', 'b']);
      expect(sorted.every(item => item.searchAfter === undefined)).toBe(true);
    });
  });
});
