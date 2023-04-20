import { Test } from "@nestjs/testing";
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/jest.extensions';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { WaitingListService } from "src/endpoints/waiting-list/waiting.list.service";
import { WaitingList } from "src/endpoints/waiting-list/entities/waiting.list";
import { QueryPagination } from "src/common/entities/query.pagination";
import { PublicAppModule } from "src/public.app.module";

describe('Waiting List Service', () => {
  let waitingListService: WaitingListService;
  const waitingList = [{
    address: 'erd1wcat0qk32u5xquuds9etauayqs29tqrzs5x3plc6djy54rmatdpsejg6qx',
    value: '270000000000000000001',
    nonce: 8859612,
    rank: 60,
  },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    waitingListService = moduleRef.get<WaitingListService>(WaitingListService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("getWaitingList", () => {
    it("should return waiting list", async () => {
      jest
        .spyOn(CacheService.prototype, 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const results = await waitingListService.getWaitingList(new QueryPagination());

      for (const result of results) {
        expect(result).toHaveProperties(['address', 'value', 'nonce', 'rank']);
        expect(result).toHaveStructure(Object.keys(new WaitingList()));
      }
    });
  });

  describe('getWaitingListForAddress', () => {
    it('should return a list of waitings for a specified address ', async () => {
      jest.spyOn(CacheService.prototype, 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => waitingList);

      const results = await waitingListService.getWaitingListForAddress("erd1wcat0qk32u5xquuds9etauayqs29tqrzs5x3plc6djy54rmatdpsejg6qx");

      expect(results).toHaveLength(1);
      expect(results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          address: "erd1wcat0qk32u5xquuds9etauayqs29tqrzs5x3plc6djy54rmatdpsejg6qx",
          value: '270000000000000000001',
          nonce: 8859612,
          rank: 60,
        }),
      ]));
    });
  });

  describe('getWaitingListCount', () => {
    it('should return total count of waiting list ', async () => {
      jest
        .spyOn(CacheService.prototype, 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, _promise: any) => waitingList));

      const result = await waitingListService.getWaitingListCount();
      expect(result).toStrictEqual(1);
    });
  });
});
