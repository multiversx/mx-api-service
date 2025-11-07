import { Test, TestingModule } from '@nestjs/testing';
import { StateChangesConsumerService } from 'src/state-changes/state.changes.consumer.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { AccountDetailsRepository } from 'src/common/indexer/db';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ClientProxy } from '@nestjs/microservices';
import { StateChangesDecoder } from 'src/state-changes/utils/state-changes.decoder';
import { ESDTType } from 'src/state-changes/entities';
import { TokenType } from 'src/common/indexer/entities';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { NftSubType } from 'src/endpoints/nfts/entities/nft.sub.type';
import { AddressUtils } from '@multiversx/sdk-nestjs-common';

jest.mock('src/state-changes/utils/state-changes.decoder');
jest.mock('@multiversx/sdk-nestjs-cache');
jest.mock('src/common/indexer/db');
jest.mock('@nestjs/microservices');
jest.mock('@multiversx/sdk-nestjs-common', () => ({
  AddressUtils: {
    isSmartContractAddress: jest.fn(),
  },
  OriginLogger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
  ComplexityEstimation: jest.fn().mockImplementation(() => () => { }),
  SwaggerUtils: {
    amountPropertyOptions: jest.fn().mockReturnValue({}),
  },
  Constants: {
    oneSecond: jest.fn(() => 1000),
    oneMinute: jest.fn(() => 60 * 1000),
    oneHour: jest.fn(() => 60 * 60 * 1000),
    oneDay: jest.fn(() => 24 * 60 * 60 * 1000),
    oneWeek: jest.fn(() => 7 * 24 * 60 * 60 * 1000),
    oneMonth: jest.fn(() => 30 * 24 * 60 * 60 * 1000),
  },
}));
jest.mock('src/common/indexer/db', () => ({
  AccountDetailsRepository: jest.fn(),
  AccountDetails: jest.fn().mockImplementation((data) => data),
}));

describe('StateChangesConsumerService', () => {
  let service: StateChangesConsumerService;
  let cacheService: jest.Mocked<CacheService>;
  let accountRepo: jest.Mocked<AccountDetailsRepository>;
  let clientProxy: jest.Mocked<ClientProxy>;
  let apiConfig: jest.Mocked<ApiConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateChangesConsumerService,
        {
          provide: CacheService,
          useValue: {
            setRemote: jest.fn(),
            setManyRemote: jest.fn(),
            deleteManyRemote: jest.fn(),
            getManyLocal: jest.fn(),
            getManyRemote: jest.fn(),
            setManyLocal: jest.fn(),
          },
        },
        {
          provide: AccountDetailsRepository,
          useValue: {
            updateAccounts: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMetaChainShardId: jest.fn().mockReturnValue(4294967295),
            isEsdtComputationEnabled: jest.fn().mockReturnValue(false)
          },
        },
        {
          provide: 'PUBSUB_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StateChangesConsumerService);
    cacheService = module.get(CacheService);
    accountRepo = module.get(AccountDetailsRepository);
    clientProxy = module.get('PUBSUB_SERVICE');
    apiConfig = module.get(ApiConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('parseCodeMetadata', () => {
    it('should return empty object if hexStr is missing', () => {
      expect(service['parseCodeMetadata']('erd1...', undefined)).toEqual({});
    });

    it('should parse non-smart contract guarded flag', () => {
      (AddressUtils.isSmartContractAddress as jest.Mock).mockReturnValue(false);
      const result = service['parseCodeMetadata']('erd1useraddress', '0800');
      expect(result).toEqual({ isGuarded: true });
    });

    it('should parse smart contract flags', () => {
      (AddressUtils.isSmartContractAddress as jest.Mock).mockReturnValue(true);
      const result = service['parseCodeMetadata']('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu', '0106');
      expect(result).toEqual({
        isUpgradeable: true,
        isReadable: false,
        isPayable: true,
        isPayableBySmartContract: true,
      });
    });
  });

  describe('parseEsdtType', () => {
    it('should map Fungible to TokenType.FungibleESDT', () => {
      expect(service['parseEsdtType'](ESDTType.Fungible)).toBe(TokenType.FungibleESDT);
    });

    it('should map NonFungible to NftType.NonFungibleESDT', () => {
      expect(service['parseEsdtType'](ESDTType.NonFungible)).toBe(NftType.NonFungibleESDT);
    });

    it('should map MetaFungible to NftType.MetaESDT', () => {
      expect(service['parseEsdtType'](ESDTType.MetaFungible)).toBe(NftType.MetaESDT);
    });
  });

  describe('parseEsdtSubtype', () => {
    it('should map NonFungibleV2 to NftSubType.NonFungibleESDTv2', () => {
      expect(service['parseEsdtSubtype'](ESDTType.NonFungibleV2)).toBe(NftSubType.NonFungibleESDTv2);
    });

    it('should map DynamicSFT to NftSubType.DynamicSemiFungibleESDT', () => {
      expect(service['parseEsdtSubtype'](ESDTType.DynamicSFT)).toBe(NftSubType.DynamicSemiFungibleESDT);
    });
  });

  describe('isStateChangesConsumerHealthy', () => {
    it('should return false if any timestamp missing', async () => {
      cacheService.getManyLocal.mockReturnValue([undefined, 1, 2]);
      const result = await StateChangesConsumerService.isStateChangesConsumerHealthy(cacheService, 10000);
      expect(result).toBe(false);
    });

    it('should return true if timestamps within threshold', async () => {
      const now = Date.now();
      cacheService.getManyLocal.mockReturnValue([now - 5000, now - 3000, now - 4000]);
      const result = await StateChangesConsumerService.isStateChangesConsumerHealthy(cacheService, 10000);
      expect(result).toBe(true);
    });

    it('should return false if timestamps too old', async () => {
      const now = Date.now();
      cacheService.getManyLocal.mockReturnValue([now - 60000, now - 70000, now - 80000]);
      const result = await StateChangesConsumerService.isStateChangesConsumerHealthy(cacheService, 10000);
      expect(result).toBe(false);
    });

    it('should fallback to remote cache if local missing and succeed', async () => {
      const now = Date.now();
      cacheService.getManyLocal.mockReturnValue([null, null, null]);
      cacheService.getManyRemote.mockResolvedValue([now - 2000, now - 3000, now - 4000]);
      const result = await StateChangesConsumerService.isStateChangesConsumerHealthy(cacheService, 10000);
      expect(result).toBe(true);
      expect(cacheService.setManyLocal).toHaveBeenCalled();
    });
  });

  describe('consumeEvents', () => {
    it('should skip meta chain shard', async () => {
      const mockBlock = { shardID: apiConfig.getMetaChainShardId(), hash: 'abc', timestampMs: Date.now() } as any;
      await service.consumeEvents(mockBlock);
      expect(StateChangesDecoder.decodeStateChangesFinal).not.toHaveBeenCalled();
    });

    it('should decode and update accounts', async () => {
      const mockBlock = { shardID: 1, hash: 'block1', timestampMs: Date.now(), stateAccessesPerAccounts: {} } as any;
      (StateChangesDecoder.decodeStateChangesFinal as jest.Mock).mockReturnValue({
        erd1abc: { accountState: { address: 'erd1abc' }, esdtState: {}, accountChanges: {}, isNewAccount: false },
      });
      const spyTransform = jest.spyOn<any, any>(service, 'transformFinalStatesToDbFormat');
      const spyUpdate = jest.spyOn<any, any>(service, 'updateAccounts').mockResolvedValue(undefined);
      await service.consumeEvents(mockBlock);
      expect(StateChangesDecoder.decodeStateChangesFinal).toHaveBeenCalled();
      expect(spyTransform).toHaveBeenCalled();
      expect(spyUpdate).toHaveBeenCalled();
      expect(cacheService.setRemote).toHaveBeenCalled();
    });

    it('should log and throw on error', async () => {
      const mockBlock = { shardID: 1, hash: 'block1', timestampMs: Date.now() } as any;
      jest.spyOn<any, any>(service, 'decodeStateChangesFinal').mockImplementation(() => { throw new Error('test'); });
      await expect(service.consumeEvents(mockBlock)).rejects.toThrow('test');
    });
  });

  describe('updateAccounts', () => {
    it('should update non-contract accounts and set cache', async () => {
      (AddressUtils.isSmartContractAddress as jest.Mock).mockReturnValue(false);
      const mockAccounts = [{ address: 'erd1', tokens: [], nfts: [], balance: '10' }];
      await service['updateAccounts'](mockAccounts as any);
      expect(accountRepo.updateAccounts).toHaveBeenCalled();
      expect(cacheService.setManyRemote).toHaveBeenCalled();
      expect(clientProxy.emit).toHaveBeenCalled();
    });

    it('should delete contract cache keys', async () => {
      (AddressUtils.isSmartContractAddress as jest.Mock).mockReturnValue(true);
      const mockAccounts = [{ address: 'erd1sc', tokens: [], nfts: [], balance: '0' }];
      await service['updateAccounts'](mockAccounts as any);
      expect(cacheService.deleteManyRemote).toHaveBeenCalled();
      expect(clientProxy.emit).toHaveBeenCalled();
    });
  });

  describe('transformFinalStatesToDbFormat', () => {
    it('should transform state changes into AccountDetails', () => {
      const mockInput =
      {
        erd1qqqqqqqqqqqqqpgqvg8r5yavkyhu6rmmkgqzgsduzheg2fk7v5ysrypdex: {
          accountState: {
            nonce: 0,
            balance: '6213923288818146107158',
            developerReward: '7695868166885300000',
            address: 'erd1qqqqqqqqqqqqqpgqvg8r5yavkyhu6rmmkgqzgsduzheg2fk7v5ysrypdex',
            ownerAddress: 'erd1rc5p5drg26vggn6jx9puv6xlgka5n6ajm6cer554tzguwfm6v5ys2pr3pc',
            codeHash: 'hRkRk4eX3AxvdJgLHruGrel+Zb0uHudVXBHqWvfvz4Q=',
            rootHash: 'CKhf02sZIbMYtII8VbKqiLgTDEr0treTXEqIgHb1l4g=',
            codeMetadata: '0500'
          },
          esdtState: {
            Fungible: [],
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
            balanceChanged: true,
            codeHashChanged: false,
            rootHashChanged: true,
            developerRewardChanged: true,
            ownerAddressChanged: false,
            userNameChanged: false,
            codeMetadataChanged: false
          },
          isNewAccount: false
        },
        erd1qqqqqqqqqqqqqpgqjwls7l4jf9qwafnxual6nadaak66g5jjeyvs9dswkt: {
          accountState: {
            nonce: 0,
            balance: '126502242682468246846',
            developerReward: '2472015964236000000',
            address: 'erd1qqqqqqqqqqqqqpgqjwls7l4jf9qwafnxual6nadaak66g5jjeyvs9dswkt',
            ownerAddress: 'erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7',
            codeHash: 'hcDhkiRq8PB5C3g5B7OcMZ020WOj+AuOOndgSDMBZ48=',
            rootHash: 'bjwTHfuhx0bs3OJFnvcb6pcTWspG9cb370yuqVbKbQo=',
            codeMetadata: '0100'
          },
          esdtState: {
            Fungible: [],
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
        },
        erd1vt2qedvltqvrar072ny88wh7vgxq9xvxmyqm4nf8qkzpwj6ncy5sjtgj90: {
          accountState: {
            nonce: 43766,
            balance: '59732371650000000000',
            developerReward: '0',
            address: 'erd1vt2qedvltqvrar072ny88wh7vgxq9xvxmyqm4nf8qkzpwj6ncy5sjtgj90',
            rootHash: 's9P9Do2C9v8r3MqG3I3MkotuYpEA1qt8jNiRCE5ULBo='
          },
          esdtState: {
            Fungible: [],
            NonFungible: [],
            NonFungibleV2: [],
            SemiFungible: [],
            MetaFungible: [],
            DynamicNFT: [],
            DynamicSFT: [],
            DynamicMeta: []
          },
          accountChanges: {
            nonceChanged: true,
            balanceChanged: true,
            codeHashChanged: false,
            rootHashChanged: false,
            developerRewardChanged: false,
            ownerAddressChanged: false,
            userNameChanged: false,
            codeMetadataChanged: false
          },
          isNewAccount: false
        },
        erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7: {
          accountState: {
            nonce: 306369,
            balance: '391457061919320000000',
            developerReward: '0',
            address: 'erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7',
            rootHash: 'fV3JuZDrwZ8TbnlawkHGYYp1bQX0fTgefUzU7xEYLh8='
          },
          esdtState: {
            Fungible: [],
            NonFungible: [],
            NonFungibleV2: [],
            SemiFungible: [],
            MetaFungible: [],
            DynamicNFT: [],
            DynamicSFT: [],
            DynamicMeta: []
          },
          accountChanges: {
            nonceChanged: true,
            balanceChanged: true,
            codeHashChanged: false,
            rootHashChanged: false,
            developerRewardChanged: false,
            ownerAddressChanged: false,
            userNameChanged: false,
            codeMetadataChanged: false
          },
          isNewAccount: false
        }
      }
      const mockShardId = 1;
      const mockBlockTimestampMs = 1762356608000;
      const expectedResult = [
        {
          address: 'erd1qqqqqqqqqqqqqpgqvg8r5yavkyhu6rmmkgqzgsduzheg2fk7v5ysrypdex',
          balance: '6213923288818146107158',
          nonce: 0,
          timestampMs: 1762356608000,
          timestamp: 1762356608,
          shard: 1,
          developerReward: '7695868166885300000',
          ownerAddress: 'erd1rc5p5drg26vggn6jx9puv6xlgka5n6ajm6cer554tzguwfm6v5ys2pr3pc',
          codeHash: 'hRkRk4eX3AxvdJgLHruGrel+Zb0uHudVXBHqWvfvz4Q=',
          rootHash: 'CKhf02sZIbMYtII8VbKqiLgTDEr0treTXEqIgHb1l4g=',
          isUpgradeable: true,
          isReadable: true,
          isPayable: false,
          isPayableBySmartContract: false
        },
        {
          address: 'erd1qqqqqqqqqqqqqpgqjwls7l4jf9qwafnxual6nadaak66g5jjeyvs9dswkt',
          balance: '126502242682468246846',
          nonce: 0,
          timestampMs: 1762356608000,
          timestamp: 1762356608,
          shard: 1,
          developerReward: '2472015964236000000',
          ownerAddress: 'erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7',
          codeHash: 'hcDhkiRq8PB5C3g5B7OcMZ020WOj+AuOOndgSDMBZ48=',
          rootHash: 'bjwTHfuhx0bs3OJFnvcb6pcTWspG9cb370yuqVbKbQo=',
          isUpgradeable: true,
          isReadable: false,
          isPayable: false,
          isPayableBySmartContract: false
        },
        {
          address: 'erd1vt2qedvltqvrar072ny88wh7vgxq9xvxmyqm4nf8qkzpwj6ncy5sjtgj90',
          balance: '59732371650000000000',
          nonce: 43766,
          timestampMs: 1762356608000,
          timestamp: 1762356608,
          shard: 1,
          developerReward: '0',
          rootHash: 's9P9Do2C9v8r3MqG3I3MkotuYpEA1qt8jNiRCE5ULBo='
        },
        {
          address: 'erd1mmjkmtlz4cwl3svqtu4u9yfp3m8wqpqdykmterrleltpt4eaeyvsa68xa7',
          balance: '391457061919320000000',
          nonce: 306369,
          timestampMs: 1762356608000,
          timestamp: 1762356608,
          shard: 1,
          developerReward: '0',
          rootHash: 'fV3JuZDrwZ8TbnlawkHGYYp1bQX0fTgefUzU7xEYLh8='
        }
      ]
      const result = service['transformFinalStatesToDbFormat'](
        mockInput,
        mockShardId,
        mockBlockTimestampMs,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should skip if no accountState', () => {
      const result = service['transformFinalStatesToDbFormat']({ erd1: {} } as any, 0, Date.now());
      expect(result.length).toBe(0);
    });
  });

  describe('deleteLocalCache', () => {
    it('should emit deleteCacheKeys event', () => {
      service['deleteLocalCache'](['key1', 'key2']);
      expect(clientProxy.emit).toHaveBeenCalledWith('deleteCacheKeys', ['key1', 'key2']);
    });
  });
});
