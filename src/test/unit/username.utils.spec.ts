import { UsernameUtils } from "src/utils/username.utils";

describe('Username Utils', () => { 
  describe('normalizeUsername', () => {
    it('Username correctly normalized', () => {
      expect(UsernameUtils.normalizeUsername('alice')).toStrictEqual('alice.elrond');
      expect(UsernameUtils.normalizeUsername('alice@google.com')).toStrictEqual('alicegooglecom.elrond');
    });
  });
});