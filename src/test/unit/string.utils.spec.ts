import { StringUtils } from "src/utils/string.utils";

describe('String Utils', () => { 
  describe('isHex', () => {
    it('isHex normal cases', () => {
      expect(StringUtils.isHex('00aaaa')).toBeTruthy();
      expect(StringUtils.isHex('00gaaa')).toBeFalsy();
    });
  });
});