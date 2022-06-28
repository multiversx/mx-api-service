import { StringUtils } from "@elrondnetwork/nestjs-microservice-common";

describe('String Utils', () => {
  describe('isHex', () => {
    it('isHex normal cases', () => {
      expect(StringUtils.isHex('00aa')).toBeTruthy();
      expect(StringUtils.isHex('00AA')).toBeTruthy();
      expect(StringUtils.isHex('00ga')).toBeFalsy();
      expect(StringUtils.isHex('00GA')).toBeFalsy();
    });
  });
  describe('isFunctionName', () => {
    it('isFunctionName normal cases', () => {
      expect(StringUtils.isHex('08xy')).toBeFalsy();
      expect(StringUtils.isHex('08XY')).toBeFalsy();
    });
  });
});
