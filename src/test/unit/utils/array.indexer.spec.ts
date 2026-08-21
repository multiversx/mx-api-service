import { ArrayIndexer } from "src/utils/array.indexer";

describe('ArrayIndexer', () => {
  const tokenItems = [
    { identifier: 'AAA-123', nonce: 1, ticker: 'AAA' },
    { identifier: 'BBB-456', nonce: 2, ticker: 'BBB' },
    { identifier: 'CCC-789', nonce: 3, ticker: 'CCC' },
  ];

  describe('getOrSetPositions', () => {
    it('builds positions map for a property', () => {
      const positions = ArrayIndexer.getOrSetPositions(tokenItems, 'identifier');

      expect(positions['AAA-123']).toStrictEqual(0);
      expect(positions['BBB-456']).toStrictEqual(1);
      expect(positions['CCC-789']).toStrictEqual(2);
    });

    it('reuses cached positions map for same array and property', () => {
      const first = ArrayIndexer.getOrSetPositions(tokenItems, 'identifier');
      const second = ArrayIndexer.getOrSetPositions(tokenItems, 'identifier');

      expect(second).toBe(first);
    });

    it('builds independent maps for different properties', () => {
      const byIdentifier = ArrayIndexer.getOrSetPositions(tokenItems, 'identifier');
      const byTicker = ArrayIndexer.getOrSetPositions(tokenItems, 'ticker');

      expect(byIdentifier).not.toBe(byTicker);
      expect(byTicker['AAA']).toStrictEqual(0);
      expect(byTicker['BBB']).toStrictEqual(1);
      expect(byTicker['CCC']).toStrictEqual(2);
    });

    it('does not reuse cache for a different array instance', () => {
      const firstArrayInstance = [
        { identifier: 'AAA-123', nonce: 1, ticker: 'AAA' },
        { identifier: 'BBB-456', nonce: 2, ticker: 'BBB' },
        { identifier: 'CCC-789', nonce: 3, ticker: 'CCC' },
      ];
      const secondArrayInstance = [
        { identifier: 'AAA-123', nonce: 1, ticker: 'AAA' },
        { identifier: 'BBB-456', nonce: 2, ticker: 'BBB' },
        { identifier: 'CCC-789', nonce: 3, ticker: 'CCC' },
      ];

      const first = ArrayIndexer.getOrSetPositions(firstArrayInstance, 'identifier');
      const second = ArrayIndexer.getOrSetPositions(secondArrayInstance, 'identifier');

      expect(second).not.toBe(first);
      expect(second).toStrictEqual(first);
    });
  });

  describe('getItemByKeyValue', () => {
    it('returns item for existing string key', () => {
      const result = ArrayIndexer.getItemByKeyValue(tokenItems, 'identifier', 'BBB-456');

      expect(result).toStrictEqual(tokenItems[1]);
    });

    it('returns item for existing numeric key', () => {
      const result = ArrayIndexer.getItemByKeyValue(tokenItems, 'nonce', 3);

      expect(result).toStrictEqual(tokenItems[2]);
    });

    it('returns undefined for missing key', () => {
      const result = ArrayIndexer.getItemByKeyValue(tokenItems, 'identifier', 'MISSING');

      expect(result).toBeUndefined();
    });
  });
});
