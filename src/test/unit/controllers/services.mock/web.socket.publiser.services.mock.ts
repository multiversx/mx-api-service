export const mockWebSocketPublisherService = () => ({
  onTransactionCompleted: jest.fn().mockResolvedValue({}),
  onTransactionPendingResults: jest.fn().mockResolvedValue({}),
  onBatchUpdated: jest.fn().mockResolvedValue({}),
});
