import { UsernameUtils } from "src/endpoints/usernames/username.utils";

describe('Username Utils', () => {
  describe('normalizeUsername', () => {
    it('Username correctly normalized', () => {
      expect(UsernameUtils.normalizeUsername('alice')).toStrictEqual('alice.elrond');
      expect(UsernameUtils.normalizeUsername('alice@google.com')).toStrictEqual('alicegooglecom.elrond');
    });
  });
  describe('encodeUserName', () => {
    it('Encode UserName to Hex', () => {
      expect(UsernameUtils.encodeUsername('alice')).toStrictEqual('616c6963652e656c726f6e64');
      expect(UsernameUtils.encodeUsername('alice@google.com')).toStrictEqual('616c696365676f6f676c65636f6d2e656c726f6e64');
    });
  });
  describe('getContractAddress', () => {
    it('Get Contract Address from normalized userName', () => {
      expect(UsernameUtils.getContractAddress('alice')).toStrictEqual('erd1qqqqqqqqqqqqqpgqf97pgqdy0tstwauxu09kszz020hp5kgqqzzsscqtww');
      expect(UsernameUtils.getContractAddress('alice@google.com')).toStrictEqual('erd1qqqqqqqqqqqqqpgqexv860na2t9cwgrvmrydgre23uc5g0ptqqts4tusev');
    });
  });
  describe('extractUsernameFromRawBase64', () => {
    it('should return an empty string for invalid inputs', () => {
      expect(UsernameUtils.extractUsernameFromRawBase64("")).toStrictEqual("");
      expect(UsernameUtils.extractUsernameFromRawBase64("invalid base64")).toStrictEqual("");
    });
    it('should work', () => {
      expect(UsernameUtils.extractUsernameFromRawBase64("YWxpY2U=")).toStrictEqual("alice");
      expect(UsernameUtils.extractUsernameFromRawBase64("YWxpY2UuZWxyb25k")).toStrictEqual("alice.elrond");
      expect(UsernameUtils.extractUsernameFromRawBase64("YWxpY2UyLnN1ZmZpeA==")).toStrictEqual("alice2.suffix");
      expect(UsernameUtils.extractUsernameFromRawBase64("dGVzdC4=")).toStrictEqual("test.");
      expect(UsernameUtils.extractUsernameFromRawBase64("YWxpY2UubXZ4")).toStrictEqual("alice.mvx");
    });
  });
});
