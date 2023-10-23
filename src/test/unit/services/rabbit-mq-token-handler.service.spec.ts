import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { TestingModule, Test } from "@nestjs/testing";
import { NotifierEvent } from "src/common/rabbitmq/entities/notifier.event";
import { RabbitMqTokenHandlerService } from "src/common/rabbitmq/rabbitmq.token.handler.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";

const cacheServiceMock = {
  set: jest.fn(),
};

const esdtServiceMock = {
  getEsdtTokenPropertiesRaw: jest.fn(),
};

const clientProxyMock = {
  emit: jest.fn(),
};

describe('RabbitMqTokenHandlerService', () => {
  let service: RabbitMqTokenHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqTokenHandlerService,
        { provide: CacheService, useValue: cacheServiceMock },
        { provide: EsdtService, useValue: esdtServiceMock },
        { provide: 'PUBSUB_SERVICE', useValue: clientProxyMock },
      ],
    }).compile();

    service = module.get<RabbitMqTokenHandlerService>(RabbitMqTokenHandlerService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle transfer ownership event with valid token properties', async () => {
    const tokenIdentifier = 'WEGLD-bd4d79';
    const event: NotifierEvent = {
      topics: [Buffer.from(tokenIdentifier).toString('base64')],
      address: "erd1",
      identifier: "WEGLD-bd4d79",
    };

    const esdtProperties = { someProperty: 'value' };

    esdtServiceMock.getEsdtTokenPropertiesRaw.mockResolvedValue(esdtProperties);

    const result = await service.handleTransferOwnershipEvent(event);

    expect(result).toBe(true);
    expect(esdtServiceMock.getEsdtTokenPropertiesRaw).toHaveBeenCalledWith(tokenIdentifier);
    expect(cacheServiceMock.set).toHaveBeenCalled();
    expect(clientProxyMock.emit).toHaveBeenCalled();
  });

  it('should handle transfer ownership event with no token properties', async () => {
    const tokenIdentifier = 'WEGLD-bd4d79';
    const event: NotifierEvent = {
      topics: [Buffer.from(tokenIdentifier).toString('base64')],
      address: "erd1",
      identifier: "WEGLD-bd4d79",
    };

    esdtServiceMock.getEsdtTokenPropertiesRaw.mockResolvedValue(null);

    const result = await service.handleTransferOwnershipEvent(event);

    expect(result).toBe(false);
    expect(esdtServiceMock.getEsdtTokenPropertiesRaw).toHaveBeenCalledWith(tokenIdentifier);
    expect(cacheServiceMock.set).not.toHaveBeenCalled();
    expect(clientProxyMock.emit).not.toHaveBeenCalled();
  });

  it('should handle transfer ownership event with exception', async () => {
    const tokenIdentifier = 'WEGLD-bd4d79';
    const event: NotifierEvent = {
      topics: [Buffer.from(tokenIdentifier).toString('base64')],
      address: "erd1",
      identifier: "WEGLD-bd4d79",
    };

    esdtServiceMock.getEsdtTokenPropertiesRaw.mockRejectedValue(new Error('Test error'));

    const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() =>
      "An unhandled error occurred when processing transferOwnership event for token with identifier 'WEGLD-bd4d79'");

    const result = await service.handleTransferOwnershipEvent(event);

    expect(result).toBe(false);
    expect(esdtServiceMock.getEsdtTokenPropertiesRaw).toHaveBeenCalledWith(tokenIdentifier);
    expect(cacheServiceMock.set).not.toHaveBeenCalled();
    expect(clientProxyMock.emit).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledTimes(2);
  });

  it('should invalidate and refresh cache key', async () => {
    const key = 'test-key';
    const data = { someData: 'value' };
    const ttl = 1000;

    await (service as any).invalidateKey(key, data, ttl);

    expect(cacheServiceMock.set).toHaveBeenCalledWith(key, data, ttl);
    expect(clientProxyMock.emit).toHaveBeenCalledWith('refreshCacheKey', { key, ttl });
  });

  it('should refresh cache key', () => {
    const key = 'test-key';
    const ttl = 1000;

    (service as any).refreshCacheKey(key, ttl);

    expect(clientProxyMock.emit).toHaveBeenCalledWith('refreshCacheKey', { key, ttl });
  });
});
