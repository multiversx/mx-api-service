import { TestingModule, Test } from "@nestjs/testing";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { NotifierEvent } from "src/common/rabbitmq/entities/notifier.event";
import { RabbitMqNftHandlerService } from "src/common/rabbitmq/rabbitmq.nft.handler.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";

describe('RabbitMqNftHandlerService', () => {
  let service: RabbitMqNftHandlerService;
  let nftService: NftService;
  let nftWorkerService: NftWorkerService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const nftServiceMock = {
      getSingleNft: jest.fn(),
    };

    const nftWorkerServiceMock = {
      addProcessNftQueueJob: jest.fn(),
      needsProcessing: jest.fn(),
    };

    const indexerServiceMock = {
      getCollection: jest.fn(),
    };

    const cacheServiceMock = {
      getLocal: jest.fn(),
      setLocal: jest.fn(),
      delete: jest.fn(),
    };

    const clientProxyMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqNftHandlerService,
        { provide: NftService, useValue: nftServiceMock },
        { provide: NftWorkerService, useValue: nftWorkerServiceMock },
        { provide: IndexerService, useValue: indexerServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: 'PUBSUB_SERVICE', useValue: clientProxyMock },
      ],
    }).compile();

    service = module.get<RabbitMqNftHandlerService>(RabbitMqNftHandlerService);
    nftService = module.get<NftService>(NftService);
    nftWorkerService = module.get<NftWorkerService>(NftWorkerService);
    cacheService = module.get<CacheService>(CacheService);

    jest.spyOn(BinaryUtils, 'base64Decode').mockImplementation((value) => {
      if (value === 'collection') return 'TEST-abcdef';
      if (value === 'nonce') return '0123456789abcdef';
      if (value === 'attributes') return 'metadata:test';
      return value;
    });

    jest.spyOn(BinaryUtils, 'base64ToHex').mockImplementation(() => '01');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleNftBurnEvent', () => {
    it('should invalidate cache for NFT', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTNFTBurn',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const result = await service.handleNftBurnEvent(event);

      expect(result).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith('nft:TEST-abcdef-01');
    });

    it('should handle errors and return false', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTNFTBurn',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const error = new Error('Test error');
      jest.spyOn(cacheService, 'delete').mockImplementation(() => {
        throw error;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.handleNftBurnEvent(event);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(`An unhandled error occurred when processing NFT Burn event for NFT with identifier 'TEST-abcdef-01'`);
      expect(loggerSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('handleNftMetadataEvent', () => {
    it('should process NFT with metadata refresh', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTMetaDataUpdate',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const nft = { identifier: 'TEST-abcdef-01' };
      jest.spyOn(nftService, 'getSingleNft').mockResolvedValue(nft as any);

      const result = await service.handleNftMetadataEvent(event);

      expect(result).toBe(true);
      expect(nftService.getSingleNft).toHaveBeenCalledWith('TEST-abcdef-01');
      expect(nftWorkerService.addProcessNftQueueJob).toHaveBeenCalledWith(
        nft,
        expect.objectContaining({
          forceRefreshMetadata: true,
          forceRefreshMedia: true,
        })
      );
    });

    it('should return false if NFT not found', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTMetaDataUpdate',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      jest.spyOn(nftService, 'getSingleNft').mockResolvedValue(undefined);
      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      const result = await service.handleNftMetadataEvent(event);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(`Could not fetch NFT details for NFT with identifier 'TEST-abcdef-01'`);
    });

    it('should handle errors', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTMetaDataUpdate',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const nft = { identifier: 'TEST-abcdef-01' };
      jest.spyOn(nftService, 'getSingleNft').mockResolvedValue(nft as any);

      const error = new Error('Test error');
      jest.spyOn(nftWorkerService, 'addProcessNftQueueJob').mockImplementation(() => {
        throw error;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.handleNftMetadataEvent(event);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(`An unhandled error occurred when processing 'ESDTMetaDataUpdate' event for NFT with identifier 'TEST-abcdef-01'`);
      expect(loggerSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('handleNftModifyCreatorEvent', () => {
    it('should invalidate cache for NFT', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTModifyCreator',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const result = await service.handleNftModifyCreatorEvent(event);

      expect(result).toBe(true);
      expect(cacheService.delete).toHaveBeenCalledWith('nft:TEST-abcdef-01');
    });

    it('should handle errors and return false', async () => {
      const event: NotifierEvent = {
        identifier: 'ESDTModifyCreator',
        address: 'erd1',
        topics: ['collection', 'nonce'],
      };

      const error = new Error('Test error');
      jest.spyOn(cacheService, 'delete').mockImplementation(() => {
        throw error;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.handleNftModifyCreatorEvent(event);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(`An unhandled error occurred when processing NFT ModifyCreator event for NFT with identifier 'TEST-abcdef-01'`);
      expect(loggerSpy).toHaveBeenCalledWith(error);
    });
  });
}); 
