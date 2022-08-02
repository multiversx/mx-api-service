import { TokenHelpers } from "src/utils/token.helpers";
import { TokenUtils } from "@elrondnetwork/erdnest";

describe('Token Utils', () => {
  describe('canBool', () => {
    it('Check function canBool', () => {
      expect(TokenHelpers.canBool('EWLD-e23800')).toBeFalsy();
      expect(TokenHelpers.canBool('MARS-96823d-01')).toBeFalsy();
    });
  });

  describe('getUrlHash', () => {
    it('Check function getUrlHash', () => {
      expect(TokenHelpers.getUrlHash('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png')).toStrictEqual('947a3912');
    });
  });

  describe('getThumbnailUrlIdentifier', () => {
    it('Check function getThumbnailUrlIdentifier', () => {
      expect(TokenHelpers.getThumbnailUrlIdentifier('MOS-b9b4b2-2710', 'https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png'))
        .toStrictEqual('MOS-b9b4b2-947a3912');
    });
  });

  describe('isToken', () => {
    it('Check isToken function', () => {
      expect(TokenUtils.isToken('MEX-455c57')).toBeTruthy();
      expect(TokenUtils.isToken('EWLD-e23800-455c74')).toBeFalsy();
    });
  });

  describe('isCollection', () => {
    it('Check isCollection function', () => {
      expect(TokenUtils.isCollection('MOS-b9b4b2')).toBeTruthy();
      expect(TokenUtils.isCollection('MOS-b9b4b2-455c74')).toBeFalsy();
    });
  });

  describe('isNft', () => {
    it('Check isNft function', () => {
      expect(TokenUtils.isNft('MOS-b9b4b2-947a3912')).toBeTruthy();
      expect(TokenUtils.isNft('MOS-b9b4b2')).toBeFalsy();
    });
  });
});
