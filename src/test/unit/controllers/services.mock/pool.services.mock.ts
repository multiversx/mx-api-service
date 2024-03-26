export const mockPoolService = () => ({
  getPool: jest.fn().mockResolvedValue([]),
  getPoolCount: jest.fn().mockResolvedValue(0),
  getTransactionFromPool: jest.fn().mockResolvedValue({}),
});
