export const mockEventEmitterService = () => ({
  emit: jest.fn().mockReturnValue(true),
  emitAsync: jest.fn().mockResolvedValue([]),
  on: jest.fn().mockReturnThis(),
  once: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  removeAllListeners: jest.fn().mockReturnThis(),
});
