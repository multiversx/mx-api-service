import { TokenUtils } from "src/utils/token.utils";

describe('Token Utils', () => {
  describe('computeNftUri', () => {
    it('ipfs.io url processing', () => {
      expect(TokenUtils.computeNftUri('https://ipfs.io/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6');
      expect(TokenUtils.computeNftUri('https://ipfs.io/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png');
    });

    it('gateway.pinata.cloud url processing', () => {
      expect(TokenUtils.computeNftUri('https://gateway.pinata.cloud/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6');
      expect(TokenUtils.computeNftUri('https://gateway.pinata.cloud/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png');
    });

    it('dweb.link url processing', () => {
      expect(TokenUtils.computeNftUri('https://dweb.link/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6');
      expect(TokenUtils.computeNftUri('https://dweb.link/ipfs/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png');
    });

    it('ipfs protocol url processing', () => {
      expect(TokenUtils.computeNftUri('ipfs://QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6');
      expect(TokenUtils.computeNftUri('ipfs://QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png');
    });

    it('.ipfs.dweb.link url processing', () => {
      expect(TokenUtils.computeNftUri('https://bafybeigc7veznuahvghwz4viugnp3ulegsbkiqld7466u5migimuzhp6bq.ipfs.dweb.link', 'https://media.elrond.com/nfts/asset')).toStrictEqual('https://media.elrond.com/nfts/asset/bafybeigc7veznuahvghwz4viugnp3ulegsbkiqld7466u5migimuzhp6bq');
    });
  });
});
