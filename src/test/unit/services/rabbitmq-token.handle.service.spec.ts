import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { TestingModule, Test } from "@nestjs/testing";
import { NotifierEvent } from "src/common/rabbitmq/entities/notifier.event";
import { RabbitMqTokenHandlerService } from "src/common/rabbitmq/rabbitmq.token.handler.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";

describe('RabbitMqTokenHandlerService', () => {
  let service: RabbitMqTokenHandlerService;
  let esdtService: EsdtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqTokenHandlerService,
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(),
          },
        },
        {
          provide: EsdtService,
          useValue: {
            getEsdtTokenPropertiesRaw: jest.fn(),
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

    service = module.get<RabbitMqTokenHandlerService>(RabbitMqTokenHandlerService);
    esdtService = module.get<EsdtService>(EsdtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleTransferOwnershipEvent', () => {
    const event: NotifierEvent = {
      identifier: 'ESDTNFTCreate',
      address: 'erd1',
      topics: [BinaryUtils.base64Encode('test-topic')],
    };

    const tokenIdentifier = 'test-topic';

    it('should return false if no properties are found for the token', async () => {
      jest.spyOn(esdtService, 'getEsdtTokenPropertiesRaw').mockResolvedValue(null);

      expect(await service.handleTransferOwnershipEvent(event)).toBe(false);
      expect(esdtService.getEsdtTokenPropertiesRaw).toHaveBeenCalledWith(tokenIdentifier);
    });
  });
});
