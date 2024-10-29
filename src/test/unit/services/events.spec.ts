import { Test, TestingModule } from '@nestjs/testing';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Events } from 'src/common/indexer/entities/events';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';
import { EventsService } from 'src/endpoints/events/events.service';

describe('EventsService', () => {
  let service: EventsService;
  let indexerService: IndexerService;

  const mockIndexerService = {
    getEvents: jest.fn(),
    getEventsCount: jest.fn(),
  };

  const generateMockEvent = (overrides = {}): Events => ({
    logAddress: "erd1qqqqqqqqqqqqqpgq5lgsm8lsen2gv65gwtrs25js0ktx7ltgusrqeltmln",
    identifier: "transferValueOnly",
    address: "erd1qqqqqqqqqqqqqpgq5lgsm8lsen2gv65gwtrs25js0ktx7ltgusrqeltmln",
    data: "44697265637443616c6c",
    topics: [
      "2386f26fc10000",
      "ec5d314f9bbf727d88c802fd407caa971ebad708cfdd311e74d7762b6abce406",
    ],
    shardID: 2,
    additionalData: [
      "44697265637443616c6c",
      "",
    ],
    txOrder: 0,
    txHash: "7e3faa2a4ea5cfe8667f2e13eb27076b0452742dbe01044871c8ea109f73ebed",
    order: 2,
    timestamp: 1727543874,
    ...overrides,
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
    it('should return a list of events', async () => {
      const pagination: QueryPagination = { from: 0, size: 10 };
      const filter: EventsFilter = new EventsFilter();
      const mockEvents = [generateMockEvent(), generateMockEvent({ identifier: 'ESDTNFTCreate' })];

      mockIndexerService.getEvents.mockResolvedValue(mockEvents);

      const result = await service.getEvents(pagination, filter);

      expect(result).toEqual(mockEvents);
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
