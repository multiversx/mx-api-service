import { WaitingListService } from "../../endpoints/waiting-list/waiting.list.service";
import { WaitingList } from "../../endpoints/waiting-list/entities/waiting.list";
import { WaitingListModule } from "src/endpoints/waiting-list/waiting.list.module";
import { Test } from "@nestjs/testing";
import '@elrondnetwork/erdnest/lib/utils/extensions/jest.extensions';
import { CachingService } from "@elrondnetwork/erdnest";

describe('WaitingListService', () => {
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
      imports: [WaitingListModule],
    }).compile();

    waitingListService = moduleRef.get<WaitingListService>(WaitingListService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("getWaitingList", () => {
    it("should return waiting list", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      const results = await waitingListService.getWaitingList();

      for (const result of results) {
        expect(result).toHaveProperties(['address', 'value', 'nonce', 'rank']);
        expect(result).toHaveStructure(Object.keys(new WaitingList()));
      }
    });
  });

  describe('getWaitingListForAddress', () => {
    it('should return a list of waitings for a specified address ', async () => {
      jest.spyOn(CachingService.prototype, 'getOrSetCache')
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
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, _promise: any) => waitingList));

      const result = await waitingListService.getWaitingListCount();
      expect(result).toStrictEqual(1);
    });
  });
});
