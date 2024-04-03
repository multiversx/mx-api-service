export const mockMexSettingsService = () => ({
  getSettings: jest.fn().mockResolvedValue({}),
});

export const mockMexEconomicsService = () => ({
  getMexEconomics: jest.fn().mockResolvedValue({}),
});

export const mockMexPairService = () => ({
  getMexPair: jest.fn().mockResolvedValue({}),
  getMexPairs: jest.fn().mockResolvedValue([]),
  getMexPairsCount: jest.fn().mockResolvedValue(0),
});

export const mockMexTokensService = () => ({
  getMexTokens: jest.fn().mockResolvedValue([]),
  getMexTokensCount: jest.fn().mockResolvedValue(0),
  getMexTokenByIdentifier: jest.fn().mockResolvedValue({}),
});

export const mockMexFarmsService = () => ({
  getMexFarms: jest.fn().mockResolvedValue([]),
  getMexFarmsCount: jest.fn().mockResolvedValue(0),
  getMexTokenByIdentifier: jest.fn().mockResolvedValue({}),
});
