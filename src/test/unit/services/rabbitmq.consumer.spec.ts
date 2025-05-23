import { TestingModule, Test } from "@nestjs/testing";
import { NotifierEvent } from "src/common/rabbitmq/entities/notifier.event";
import { NotifierEventIdentifier } from "src/common/rabbitmq/entities/notifier.event.identifier";
import { RabbitMqConsumer } from "src/common/rabbitmq/rabbitmq.consumer";
import { RabbitMqNftHandlerService } from "src/common/rabbitmq/rabbitmq.nft.handler.service";
import { RabbitMqTokenHandlerService } from "src/common/rabbitmq/rabbitmq.token.handler.service";

describe('RabbitMqConsumer', () => {
  let service: RabbitMqConsumer;
  let nftHandlerService: RabbitMqNftHandlerService;
  let tokenHandlerService: RabbitMqTokenHandlerService;

  beforeEach(async () => {
    const nftHandlerServiceMock = {
      handleNftCreateEvent: jest.fn(),
      handleNftUpdateAttributesEvent: jest.fn(),
      handleNftBurnEvent: jest.fn(),
      handleNftMetadataEvent: jest.fn(),
      handleNftModifyCreatorEvent: jest.fn(),
    };

    const tokenHandlerServiceMock = {
      handleTransferOwnershipEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqConsumer,
        { provide: RabbitMqNftHandlerService, useValue: nftHandlerServiceMock },
        { provide: RabbitMqTokenHandlerService, useValue: tokenHandlerServiceMock },
      ],
    }).compile();

    service = module.get<RabbitMqConsumer>(RabbitMqConsumer);
    nftHandlerService = module.get<RabbitMqNftHandlerService>(RabbitMqNftHandlerService);
    tokenHandlerService = module.get<RabbitMqTokenHandlerService>(RabbitMqTokenHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call the appropriate handler based on the event identifier', async () => {
    const event1: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTNFTCreate,
      address: "erd1",
      topics: [''],
    };

    const event2: NotifierEvent = {
      identifier: NotifierEventIdentifier.transferOwnership,
      address: "erd1",
      topics: [''],
    };

    const event3: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTNFTBurn,
      address: "erd1",
      topics: [''],
    };

    const event4: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTMetaDataUpdate,
      address: "erd1",
      topics: [''],
    };

    const event5: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTModifyCreator,
      address: "erd1",
      topics: [''],
    };

    await service.consumeEvents({ events: [event1, event2, event3, event4, event5] });

    expect(nftHandlerService.handleNftCreateEvent).toHaveBeenCalledWith(event1);
    expect(tokenHandlerService.handleTransferOwnershipEvent).toHaveBeenCalledWith(event2);
    expect(nftHandlerService.handleNftBurnEvent).toHaveBeenCalledWith(event3);
    expect(nftHandlerService.handleNftMetadataEvent).toHaveBeenCalledWith(event4);
    expect(nftHandlerService.handleNftModifyCreatorEvent).toHaveBeenCalledWith(event5);
  });

  it('should handle ESDTMetaDataRecreate with the metadata event handler', async () => {
    const event: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTMetaDataRecreate,
      address: "erd1",
      topics: [''],
    };

    await service.consumeEvents({ events: [event] });

    expect(nftHandlerService.handleNftMetadataEvent).toHaveBeenCalledWith(event);
  });

  it('should log the error when an unhandled error occurs', async () => {
    const event: NotifierEvent = {
      identifier: NotifierEventIdentifier.ESDTNFTCreate,
      address: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz",
      topics: [''],
    };

    const error = new Error('Test error');

    jest.spyOn(nftHandlerService, 'handleNftCreateEvent').mockImplementationOnce(() => {
      throw error;
    });

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() =>
      `An unhandled error occurred when consuming events: {"events":[{"identifier":"ESDTNFTCreate","address":"erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz","topics":[""]}]}`);

    await service.consumeEvents({ events: [event] });

    expect(loggerSpy).toHaveBeenCalledWith(`An unhandled error occurred when consuming events: ${JSON.stringify({ events: [event] })}`);
    expect(loggerSpy).toHaveBeenCalledWith(error);
  });
});
