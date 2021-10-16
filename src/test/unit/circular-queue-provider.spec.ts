import { CircularQueueProvider } from 'src/utils/circular-queue-provider';

describe('Circular Queue Provider', () => {
  describe('Circular Queue', () => {
    const metachainShardId = 999999;
    const testNodes = [
      { address: 'obs-shard0-id0', shardId: 0 },
      { address: 'obs-shard1-id0', shardId: 1 },
    ];

    it('should throw an error if nodes list is empty', () => {
      expect(() => {
        new CircularQueueProvider([]);
      }).toThrowError();
    });

    it('should not throw an error if nodes list is not empty', () => {
      expect(() => {
        new CircularQueueProvider(testNodes);
      }).not.toThrowError();
    });

    it("should return a shard's list of nodes", () => {
      const shardId = 0;
      const queue = new CircularQueueProvider(testNodes);

      expect(() => {
        const res = queue.getNodesByShardId(shardId);

        expect(res.length).toBe(1);
      }).not.toThrowError();
    });

    it('should balance observers by shard', () => {
      const shardId = 0;
      const nodes = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard0-id2', shardId: 0 },
      ];
      const queue = new CircularQueueProvider(nodes);

      const res1 = queue.getNodesByShardId(shardId);
      const res2 = queue.getNodesByShardId(shardId);

      expect(res1).not.toMatchObject(res2);

      queue.getNodesByShardId(shardId);
      const res4 = queue.getNodesByShardId(shardId);

      expect(res1).toMatchObject(res4);
    });

    it('should return the list of nodes', () => {
      const queue = new CircularQueueProvider(testNodes);

      expect(() => {
        const res = queue.getAllNodes();

        expect(res.length).toBe(2);
      }).not.toThrowError();
    });

    it('should balance observers', () => {
      const nodes = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard1-id0', shardId: 1 },
        { address: 'obs-shard1-id1', shardId: 1 },
      ];
      const queue = new CircularQueueProvider(nodes);

      const res1 = queue.getAllNodes();
      const res2 = queue.getAllNodes();

      expect(res1).not.toMatchObject(res2);

      queue.getAllNodes();
      queue.getAllNodes();
      const res5 = queue.getAllNodes();

      expect(res1).toMatchObject(res5);
    });

    it('should balance observers distribution', () => {
      const nodes = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard0-id2', shardId: 0 },
        { address: 'obs-shard0-id3', shardId: 0 },
        { address: 'obs-shard1-id0', shardId: 1 },
        { address: 'obs-shard1-id1', shardId: 1 },
        { address: 'obs-shard1-id2', shardId: 1 },
        { address: 'obs-shard1-id3', shardId: 1 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shard2-id1', shardId: 2 },
        { address: 'obs-shard2-id2', shardId: 2 },
        { address: 'obs-shard2-id3', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
        { address: 'obs-shardmeta-id2', shardId: metachainShardId },
        { address: 'obs-shardmeta-id3', shardId: metachainShardId },
      ];
      const expected = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard1-id0', shardId: 1 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard1-id1', shardId: 1 },
        { address: 'obs-shard2-id1', shardId: 2 },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
        { address: 'obs-shard0-id2', shardId: 0 },
        { address: 'obs-shard1-id2', shardId: 1 },
        { address: 'obs-shard2-id2', shardId: 2 },
        { address: 'obs-shardmeta-id2', shardId: metachainShardId },
        { address: 'obs-shard0-id3', shardId: 0 },
        { address: 'obs-shard1-id3', shardId: 1 },
        { address: 'obs-shard2-id3', shardId: 2 },
        { address: 'obs-shardmeta-id3', shardId: metachainShardId },
      ];

      const queue = new CircularQueueProvider(nodes);
      const res = queue.getAllNodes();

      for (let i = 0; i < res.length; i++) {
        expect(res[i]).toMatchObject(expected[i]);
      }
    });

    it('should work with unbalanced observers distribution', () => {
      const nodes = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard0-id2', shardId: 0 },
        { address: 'obs-shard1-id0', shardId: 1 },
        { address: 'obs-shard1-id1', shardId: 1 },
        { address: 'obs-shard1-id2', shardId: 1 },
        { address: 'obs-shard1-id3', shardId: 1 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
        { address: 'obs-shardmeta-id2', shardId: metachainShardId },
        { address: 'obs-shardmeta-id3', shardId: metachainShardId },
        { address: 'obs-shardmeta-id4', shardId: metachainShardId },
      ];
      const expected = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard1-id0', shardId: 1 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shard0-id1', shardId: 0 },
        { address: 'obs-shard1-id1', shardId: 1 },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
        { address: 'obs-shard0-id2', shardId: 0 },
        { address: 'obs-shard1-id2', shardId: 1 },
        { address: 'obs-shardmeta-id2', shardId: metachainShardId },
        { address: 'obs-shard1-id3', shardId: 1 },
        { address: 'obs-shardmeta-id3', shardId: metachainShardId },
        { address: 'obs-shardmeta-id4', shardId: metachainShardId },
      ];
      const queue = new CircularQueueProvider(nodes);
      const res = queue.getAllNodes();

      for (let i = 0; i < res.length; i++) {
        expect(res[i]).toMatchObject(expected[i]);
      }
    });

    it('should work with empty shard', () => {
      const nodes = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
      ];
      const expected = [
        { address: 'obs-shard0-id0', shardId: 0 },
        { address: 'obs-shard2-id0', shardId: 2 },
        { address: 'obs-shardmeta-id0', shardId: metachainShardId },
        { address: 'obs-shardmeta-id1', shardId: metachainShardId },
      ];

      const queue = new CircularQueueProvider(nodes);
      const res = queue.getAllNodes();

      for (let i = 0; i < res.length; i++) {
        expect(res[i]).toMatchObject(expected[i]);
      }
    });

    it('should work with single shard', () => {
      const nodes = [{ address: 'obs-shard0-id0', shardId: 0 }];
      const expected = [{ address: 'obs-shard0-id0', shardId: 0 }];

      const queue = new CircularQueueProvider(nodes);
      const res = queue.getAllNodes();

      for (let i = 0; i < res.length; i++) {
        expect(res[i]).toMatchObject(expected[i]);
      }
    });
  });
});
