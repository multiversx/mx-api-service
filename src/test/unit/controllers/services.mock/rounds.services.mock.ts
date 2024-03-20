export const mockRoundService = () => ({
  getRounds: jest.fn().mockResolvedValue([]),
  getRoundCount: jest.fn().mockResolvedValue(0),
  getRound: jest.fn().mockResolvedValue({}),
});
