export const mockBlockService = () => ({
  getBlocks: jest.fn().mockResolvedValue([]),
  getBlocksCount: jest.fn().mockResolvedValue(0),
  getLatestBlock: jest.fn().mockResolvedValue({}),
  getBlock: jest.fn().mockResolvedValue({}),
});
