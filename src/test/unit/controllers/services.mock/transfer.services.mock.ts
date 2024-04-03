export const mockTransferService = () => ({
  getTransfers: jest.fn().mockResolvedValue([]),
  getTransfersCount: jest.fn().mockResolvedValue(0),
});
