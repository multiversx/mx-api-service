export const mockCollectionService = () => ({
  getNftCollections: jest.fn().mockResolvedValue([]),
  getNftCollectionCount: jest.fn().mockResolvedValue(0),
  getNftCollection: jest.fn().mockResolvedValue({}),
  getNftCollectionRanks: jest.fn().mockResolvedValue([]),
  isCollection: jest.fn().mockResolvedValue(false),
  getLogoPng: jest.fn().mockResolvedValue({}),
  getLogoSvg: jest.fn().mockResolvedValue({}),
});

export const mockNftService = () => ({
  getNfts: jest.fn().mockResolvedValue([]),
  getNftCount: jest.fn().mockResolvedValue(0),
  getCollectionOwners: jest.fn().mockResolvedValue([]),
});

export const mockTransactionService = () => ({
  getTransactions: jest.fn().mockResolvedValue([]),
  getTransactionCount: jest.fn().mockResolvedValue(0),
});
