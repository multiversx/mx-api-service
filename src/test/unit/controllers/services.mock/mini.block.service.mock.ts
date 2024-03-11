export const mockMiniBlockService = () => ({
  getMiniBlocks: jest.fn().mockResolvedValue([]),
  getMiniBlock: jest.fn().mockResolvedValue({}),
});
