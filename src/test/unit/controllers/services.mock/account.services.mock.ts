export const mockAccountService = () => ({
  getAccounts: jest.fn().mockResolvedValue([]),
  getAccountsCount: jest.fn().mockResolvedValue(0),
  getAccount: jest.fn().mockResolvedValue({}),
  getDeferredAccount: jest.fn().mockResolvedValue([]),
  getAccountVerification: jest.fn().mockResolvedValue(null),
  getAccountContracts: jest.fn().mockResolvedValue([]),
  getAccountContractsCount: jest.fn().mockResolvedValue(0),
  getKeys: jest.fn().mockResolvedValue([]),
  getWaitingListForAddress: jest.fn().mockResolvedValue([]),
});

export const mockTokenService = () => ({
  isToken: jest.fn().mockResolvedValue(false),
  getTokensForAddress: jest.fn().mockResolvedValue([]),
  getTokenCountForAddress: jest.fn().mockResolvedValue(0),
  getTokenForAddress: jest.fn().mockResolvedValue({}),
  getTokensWithRolesForAddress: jest.fn().mockResolvedValue([]),
  getTokensWithRolesForAddressCount: jest.fn().mockResolvedValue(0),
  getTokenWithRolesForAddress: jest.fn().mockResolvedValue(0),
});

export const mockNftService = () => ({
  getNftsForAddress: jest.fn().mockResolvedValue([]),
  getNftCountForAddress: jest.fn().mockResolvedValue(0),
  getNftForAddress: jest.fn().mockResolvedValue({}),
  isNft: jest.fn().mockResolvedValue(true),
});

export const mockDelegationLegacyService = () => ({
  getDelegationForAddress: jest.fn().mockResolvedValue({}),
});

export const mockWaitingListService = () => ({
  getWaitingListForAddress: jest.fn().mockResolvedValue([]),
});

export const mockStakeService = () => ({
  getStakeForAddress: jest.fn().mockResolvedValue({}),
});

export const mockTransactionService = () => ({
  getTransactions: jest.fn().mockResolvedValue([]),
  getTransactionCount: jest.fn().mockResolvedValue(0),
});

export const mockSmartContractResultService = () => ({
  getAccountScResults: jest.fn().mockResolvedValue([]),
  getAccountScResultsCount: jest.fn().mockResolvedValue(0),
  getScResult: jest.fn().mockResolvedValue({}),
});

export const mockCollectionService = () => ({
  getCollectionsForAddress: jest.fn().mockResolvedValue([]),
  getCollectionCountForAddress: jest.fn().mockResolvedValue(0),
  getCollectionForAddress: jest.fn().mockResolvedValue({}),
  getCollectionsWithRolesForAddress: jest.fn().mockResolvedValue([]),
  getCollectionCountForAddressWithRoles: jest.fn().mockResolvedValue(0),
  isCollection: jest.fn().mockResolvedValue(true),
});

export const mockTransferService = () => ({
  getTransfers: jest.fn().mockResolvedValue([]),
  getTransfersCount: jest.fn().mockResolvedValue(0),
});

export const mockApiConfigService = () => ({
  getIsIndexerV3FlagActive: jest.fn().mockReturnValue(false),
  getAxiosTimeout: jest.fn().mockReturnValue(0),
  getRateLimiterSecret: jest.fn().mockReturnValue(0),
  getServerTimeout: jest.fn().mockReturnValue(0),
  getUseKeepAliveAgentFlag: jest.fn().mockReturnValue(false),
  getElasticUrl: jest.fn().mockReturnValue(''),
  getRedisUrl: jest.fn().mockReturnValue(''),
  getPoolLimit: jest.fn().mockReturnValue(''),
  getProcessTtl: jest.fn().mockReturnValue(''),
  getExternalMediaUrl: jest.fn().mockReturnValue(''),
  getMediaUrl: jest.fn().mockReturnValue(''),
  isElasticCircuitBreakerEnabled: jest.fn().mockReturnValue(false),
  getElasticCircuitBreakerConfig: jest.fn().mockReturnValue({}),
  getConfig: jest.fn(),
});

export const mockDelegationService = () => ({
  getDelegationForAddress: jest.fn().mockResolvedValue([]),
});
