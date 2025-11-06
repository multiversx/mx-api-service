import { StateChangesDecoder } from 'src/state-changes/utils/state-changes.decoder';
import { AccountChangesRaw, DataTrieChangeOperation, StateAccessOperation } from 'src/state-changes/entities'

describe('StateChangesDecoder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSystemContractAddress', () => {
    it('should detect system addresses correctly', () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7';
      expect(StateChangesDecoder.isSystemContractAddress(address)).toBe(true);
      expect(StateChangesDecoder.isSystemContractAddress('erd1random')).toBe(false);
    });
  });

  describe('decodeMxSignMagBigInt', () => {
    it('should decode zero buffer', () => {
      expect(StateChangesDecoder['decodeMxSignMagBigInt'](new Uint8Array([0x00, 0x00]))).toBe(BigInt(0));
    });

    it('should decode positive big int', () => {
      const result = StateChangesDecoder['decodeMxSignMagBigInt'](new Uint8Array([0x00, 0x01, 0x02]));
      expect(result).toBe(BigInt(258));
    });

    it('should decode negative big int', () => {
      const result = StateChangesDecoder['decodeMxSignMagBigInt'](new Uint8Array([0x01, 0x01]));
      expect(result).toBe(BigInt(-1));
    });

    it('should decode fallback magnitude', () => {
      const result = StateChangesDecoder['decodeMxSignMagBigInt'](new Uint8Array([0x05]));
      expect(result).toBe(BigInt(5));
    });
  });

  describe('getDecodedUserAccountData', () => {
    it('should return null for invalid base64', () => {
      const result = StateChangesDecoder['getDecodedUserAccountData']('invalidbase64');
      expect(result).toBeNull();
    });

    it('should decode valid UserAccountData', () => {
      const base64Value = "EgoABtuSP3tqxyU+GiCFwOGSJGrw8HkLeDkHs5wxnTbRY6P4C446d2BIMwFnjyIgo7jh8DROSNY3jtZL6vVOdbo/PP+O+6q/7dB+r0GfmDwqIAAAAAAAAAAABQCTvw9+sklA7qZm53+p9b3ttaRSUskZMgkAIko5RBEBXgA6IN7lba/irh34wYBfK8KRIY7O4AQNJba8jH/P1hXXPckZSgIBAA=="
      const result = StateChangesDecoder['getDecodedUserAccountData'](base64Value);

      const expectedResult = {
        nonce: 0,
        balance: '126502242682468246846',
        developerReward: '2470850310072000000',
        address: 'erd1qqqqqqqqqqqqqpgqjwls7l4jf9qwafnxual6nadaak66g5jjeyvs9dswkt',
        ownerAddress: 'erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7',
        codeHash: 'hcDhkiRq8PB5C3g5B7OcMZ020WOj+AuOOndgSDMBZ48=',
        rootHash: 'o7jh8DROSNY3jtZL6vVOdbo/PP+O+6q/7dB+r0GfmDw=',
        codeMetadata: '0100'
      }
      expect(result).toHaveProperty('nonce', expectedResult.nonce);
      expect(result).toHaveProperty('balance', expectedResult.balance);
      expect(result).toHaveProperty('developerReward', expectedResult.developerReward);
      expect(result).toHaveProperty('address', expectedResult.address);
      expect(result).toHaveProperty('ownerAddress', expectedResult.ownerAddress);
      expect(result).toHaveProperty('codeHash', expectedResult.codeHash);
      expect(result).toHaveProperty('rootHash', expectedResult.rootHash);
      expect(result).toHaveProperty('codeMetadata', expectedResult.codeMetadata);
    });
  });

  describe('decodeAccountChanges', () => {
    it('should decode all flags correctly', () => {
      const result = StateChangesDecoder['decodeAccountChanges'](
        AccountChangesRaw.BalanceChanged | AccountChangesRaw.RootHashChanged
      );
      expect(result.balanceChanged).toBe(true);
      expect(result.rootHashChanged).toBe(true);
      expect(result.nonceChanged).toBe(false);
    });

    it('should handle undefined flags', () => {
      const result = StateChangesDecoder['decodeAccountChanges'](undefined);
      expect(result.balanceChanged).toBe(false);
    });
  });

  describe('getDecodedEsdtData', () => {
    it('should return null for invalid key prefix', () => {
      const dataTrieChange = { key: Buffer.from('BADKEY').toString('base64'), val: 'AA==', version: 1 };
      const result = StateChangesDecoder['getDecodedEsdtData']('erd1test', dataTrieChange as any);
      expect(result).toBeNull();
    });

    it('should decode valid ESDT data', () => {
      const expectedResult = {
        identifier: 'MEX-a659d0',
        nonce: '0',
        type: 0,
        value: '135399426293137262324524632',
        propertiesHex: '',
        reservedHex: '',
        tokenMetaData: null
      }

      const dataTrieChange = {
        type: 1,
        key: 'RUxST05EZXNkdE1FWC1hNjU5ZDA=',
        val: 'EgwAb//xm2Vec+YQplg=',
        version: 1,
        operation: DataTrieChangeOperation.NotDelete
      }

      const result = StateChangesDecoder['getDecodedEsdtData']('erd150sh7scpm4q7tdtntte975kt0cgg3r4exf8mtwurfradguzxzuqsahzma8', dataTrieChange as any);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('isNewAccount', () => {
    it('should detect new account correctly', () => {
      const result = StateChangesDecoder['isNewAccount']({
        accountChanges: undefined,
        operation: StateAccessOperation.SaveAccount,
      } as any);
      expect(result).toBe(true);
    });

    it('should detect existing account correctly', () => {
      const result = StateChangesDecoder['isNewAccount']({
        accountChanges: 1,
        operation: 0,
      } as any);
      expect(result).toBe(false);
    });
  });

  describe('getAccountFinalState', () => {
    it('should get final account state from block state accesses', () => {
      const mockAccountStateAccesses = [
        {
          type: 1,
          index: 1,
          txHash: 'zvAPJGf0O/fbqGo5eq9kqs2AguViaEYvyEZmiTQDDwE=',
          mainTrieKey: 'AAAAAAAAAAAFAHStkhZzzH/1idZo4AjPvzAQydYdiBc=',
          mainTrieVal: 'EgIAABog9S1Hs2tTj7zA+JLDTnD29ncfZtRsxevT36irfG9yrWIiIBEmI7nptDIBxcYWKgu6Jou5jHnvmOIOj1vjVDHFPMX3KiAAAAAAAAAAAAUAdK2SFnPMf/WJ1mjgCM+/MBDJ1h2IFzIIACD1dWNCKQA6IE+qi6TxMzNnwNuQ8fhDq6VBoT9FgTUSb6bVix2DrIgXSgIFAA==',
          operation: 2,
          dataTrieChanges: [
            {
              type: 1,
              key: 'RUxST05EZXNkdEZPWFNZLTg2ZWNmZQ==',
              val: 'EgkADeC2s6dkAAA=',
              version: 1,
              operation: 0
            },
            {
              type: 1,
              key: 'RUxST05EZXNkdEZPWFNZLTg2ZWNmZQ==',
              val: 'EgkADeC2s6dkAAA=',
              version: 1,
              operation: 1
            },
            {
              type: 1,
              key: 'dG91cm5hbWVudHMAAAACnPg=',
              val: 'AAAAApz4AAAAAGkLbEgAAAAAaQtuoAAAAAgN4Lazp2QAAAAAAAgN4Lazp2QAAAAAAAgpoiQa9iwAAABuAVv6I33/nQnW+3wmlLfavrSvstjnldid65XTjQ3nqgAAAAXwE1AptY3LtZdlBeh6mcP3eiC1CGvqqv/3e6SOTNq3cgAAAALsE8pgwEzgJ+Nk3sKxnZ6OQQ6s/5JhxCXnioUMFmdfpcqTAAAAAuwUQUO2CdnII2pbbgiyzP4TjqaZ99MUJtkS4/wxY6YkOxQAAAAC7BW8zrxROav1ST0TIld62AKhGxMYVMoJVvzDxYCXrvzY7gAAAALsFru2lwb0jw3/9QMkG67zHFB792NjLXypEOW/9DcOhiUMAAAAAuwX',
              version: 1,
              operation: 0
            }
          ],
          accountChanges: 24
        }
      ]

      const expectedResult = {
        accountState: {
          nonce: 0,
          balance: '0',
          developerReward: '9277083780000000',
          address: 'erd1qqqqqqqqqqqqqpgqwjkey9nne3lltzwkdrsq3nalxqgvn4sa3qtse7d6nx',
          ownerAddress: 'erd1f74ghf83xvek0sxmjrclssat54q6z069sy63ymax6k93mqav3qtsp2rv0l',
          codeHash: '9S1Hs2tTj7zA+JLDTnD29ncfZtRsxevT36irfG9yrWI=',
          rootHash: 'ESYjuem0MgHFxhYqC7omi7mMee+Y4g6PW+NUMcU8xfc=',
          codeMetadata: '0500'
        },
        esdtState: {
          Fungible: [
            {
              identifier: 'FOXSY-86ecfe',
              nonce: '0',
              type: 0,
              value: '0',
              propertiesHex: '',
              reservedHex: '',
              tokenMetaData: null
            }
          ],
          NonFungible: [],
          NonFungibleV2: [],
          SemiFungible: [],
          MetaFungible: [],
          DynamicNFT: [],
          DynamicSFT: [],
          DynamicMeta: []
        },
        accountChanges: {
          nonceChanged: false,
          balanceChanged: false,
          codeHashChanged: false,
          rootHashChanged: true,
          developerRewardChanged: true,
          ownerAddressChanged: false,
          userNameChanged: false,
          codeMetadataChanged: false
        },
        isNewAccount: false
      }
      const result = StateChangesDecoder['getAccountFinalState']('erd1dwkr89z4mmqxxgrv0ks62pccmqsheqq3zjwpa7r7fh6v5dgnrmjs8a9wng', mockAccountStateAccesses);
      expect(result).toEqual(expectedResult);
    });
  });
});
