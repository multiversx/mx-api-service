export const mockIdentityService = () => ({
  getIdentities: jest.fn().mockResolvedValue([]),
  getIdentity: jest.fn().mockResolvedValue({}),
  getIdentityAvatar: jest.fn().mockResolvedValue(undefined),
});
