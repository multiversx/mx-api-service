export const mockScResultsService = () => ({
  getScResults: jest.fn().mockResolvedValue([]),
  getScResultsCount: jest.fn().mockResolvedValue(0),
  getScResult: jest.fn().mockResolvedValue({}),
});
