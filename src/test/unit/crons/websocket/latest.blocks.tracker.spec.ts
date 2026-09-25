import { LatestBlocksTracker } from 'src/crons/websocket/latest.blocks.tracker';

describe('LatestBlocksTracker', () => {
  let latestBlocks: string[];
  let getList: jest.Mock;
  let tracker: LatestBlocksTracker;

  const roomsOf = (...names: string[]) => new Map(names.map(name => [name, new Set(['socket'])]));

  beforeEach(() => {
    latestBlocks = ['a1', 'b1', 'c1'];
    getList = jest.fn().mockImplementation(async () => await Promise.resolve(latestBlocks.map(hash => ({ hash }))));

    tracker = new LatestBlocksTracker(
      { getList } as any,
      { getShardCount: async () => await Promise.resolve(2) } as any,
      { getWebsocketSubscriptionBroadcastIntervalMs: () => 0 } as any,
    );
  });

  it('returns only the rooms with the given prefix', async () => {
    const rooms = roomsOf('socket-id', 'tx-{"size":25}', 'custom-tx-{"sender":"alice"}', 'blocks-{}');

    expect(await tracker.getRoomsWithNewBlocks('tx-', rooms)).toEqual(['tx-{"size":25}']);
  });

  it('skips rooms already pushed for the latest blocks', async () => {
    const rooms = roomsOf('tx-{"size":25}');

    expect(await tracker.getRoomsWithNewBlocks('tx-', rooms)).toHaveLength(1);
    expect(await tracker.getRoomsWithNewBlocks('tx-', rooms)).toHaveLength(0);

    latestBlocks = ['a2', 'b1', 'c1'];
    expect(await tracker.getRoomsWithNewBlocks('tx-', rooms)).toHaveLength(1);
  });

  it('pushes new rooms right away', async () => {
    await tracker.getRoomsWithNewBlocks('tx-', roomsOf('tx-{"size":25}'));

    const roomNames = await tracker.getRoomsWithNewBlocks('tx-', roomsOf('tx-{"size":25}', 'tx-{"size":10}'));

    expect(roomNames).toEqual(['tx-{"size":10}']);
  });

  it('pushes again to a room that was emptied and joined again', async () => {
    await tracker.getRoomsWithNewBlocks('tx-', roomsOf('tx-{"size":25}'));
    await tracker.getRoomsWithNewBlocks('tx-', roomsOf());

    expect(await tracker.getRoomsWithNewBlocks('tx-', roomsOf('tx-{"size":25}'))).toHaveLength(1);
  });

  it('keeps track of each prefix separately', async () => {
    const rooms = roomsOf('tx-{}', 'blocks-{}');

    expect(await tracker.getRoomsWithNewBlocks('tx-', rooms)).toEqual(['tx-{}']);
    expect(await tracker.getRoomsWithNewBlocks('blocks-', rooms)).toEqual(['blocks-{}']);
  });

  it('asks elastic for one block per shard including the metachain', async () => {
    await tracker.getRoomsWithNewBlocks('tx-', roomsOf());

    expect(getList.mock.calls[0][2].pagination).toEqual({ from: 0, size: 3 });
  });
});
