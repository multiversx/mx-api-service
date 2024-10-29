import { Test, TestingModule } from '@nestjs/testing';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Events as IndexerEvents } from 'src/common/indexer/entities/events';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { Events } from 'src/endpoints/events/entities/events';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';
import { EventsService } from 'src/endpoints/events/events.service';

describe('EventsService', () => {
  let service: EventsService;
  let indexerService: IndexerService;

  const mockIndexerService = {
    getEvents: jest.fn(),
    getEventsCount: jest.fn(),
  };

  const baseMockEventData = {
    logAddress: "erd1qqqqqqqqqqqqqpgq5lgsm8lsen2gv65gwtrs25js0ktx7ltgusrqeltmln",
    address: "erd1qqqqqqqqqqqqqpgq5lgsm8lsen2gv65gwtrs25js0ktx7ltgusrqeltmln",
    data: "44697265637443616c6c",
    topics: [
      "2386f26fc10000",
      "ec5d314f9bbf727d88c802fd407caa971ebad708cfdd311e74d7762b6abce406",
    ],
    shardID: 2,
    additionalData: ["44697265637443616c6c", ""],
    txOrder: 0,
    order: 2,
    timestamp: 1727543874,
  };

  const generateMockEvent = (overrides = {}): IndexerEvents => ({
    _id: "7e3faa2a4ea5cfe8667f2e13eb27076b0452742dbe01044871c8ea109f73ebed",
    identifier: "transferValueOnly",
    ...baseMockEventData,
    ...overrides,
  });

  const createExpectedEvent = (txHash: string, identifier: string) => new Events({
    txHash,
    identifier,
    ...baseMockEventData,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: IndexerService, useValue: mockIndexerService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    indexerService = module.get<IndexerService>(IndexerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return a list of events with mapped fields', async () => {
      const pagination: QueryPagination = { from: 0, size: 10 };
      const filter: EventsFilter = new EventsFilter();

      const mockElasticEvents = [
        generateMockEvent(),
        generateMockEvent({ _id: "5d4a7cd39caf55aaaef038d2fe5fd864b01db2170253c158-1-1", identifier: 'ESDTNFTCreate' }),
      ];

      const expectedEvents = [
        createExpectedEvent("7e3faa2a4ea5cfe8667f2e13eb27076b0452742dbe01044871c8ea109f73ebed", "transferValueOnly"),
        createExpectedEvent("5d4a7cd39caf55aaaef038d2fe5fd864b01db2170253c158-1-1", "ESDTNFTCreate"),
      ];

      mockIndexerService.getEvents.mockResolvedValue(mockElasticEvents);

      const result = await service.getEvents(pagination, filter);

      expect(result).toEqual(expectedEvents);
      expect(indexerService.getEvents).toHaveBeenCalledWith(pagination, filter);
    });

    it('should return an empty list if no events are found', async () => {
      const pagination: QueryPagination = { from: 0, size: 10 };
      const filter: EventsFilter = new EventsFilter();

      mockIndexerService.getEvents.mockResolvedValue([]);

      const result = await service.getEvents(pagination, filter);

      expect(result).toEqual([]);
      expect(indexerService.getEvents).toHaveBeenCalledWith(pagination, filter);
    });
  });

  describe('getEventsCount', () => {
    it('should return the count of events', async () => {
      const filter: EventsFilter = new EventsFilter();
      const mockCount = 42;

      mockIndexerService.getEventsCount.mockResolvedValue(mockCount);

      const result = await service.getEventsCount(filter);

      expect(result).toEqual(mockCount);
      expect(indexerService.getEventsCount).toHaveBeenCalledWith(filter);
    });

    it('should return zero if no events are found', async () => {
      const filter: EventsFilter = new EventsFilter();

      mockIndexerService.getEventsCount.mockResolvedValue(0);

      const result = await service.getEventsCount(filter);

      expect(result).toEqual(0);
      expect(indexerService.getEventsCount).toHaveBeenCalledWith(filter);
    });
  });
});
