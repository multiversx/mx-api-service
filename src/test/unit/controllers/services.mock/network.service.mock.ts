export const mockNetworkService = () => ({
  getConstants: jest.fn().mockResolvedValue({}),
  getEconomics: jest.fn().mockResolvedValue({}),
  getStats: jest.fn().mockResolvedValue({}),
  getAbout: jest.fn().mockResolvedValue({}),
});
