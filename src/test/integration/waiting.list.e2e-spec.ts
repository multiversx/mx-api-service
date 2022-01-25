import { WaitingListService } from "../../endpoints/waiting-list/waiting.list.service";
import Initializer from "./e2e-init";
import { Constants } from "../../utils/constants";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";

describe('WaitingListService', () => {
  let waitingListService: WaitingListService;
  let waitingListAddress: string;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    waitingListService = moduleRef.get<WaitingListService>(WaitingListService);
  }, Constants.oneHour() * 1000);

  describe('Waiting List', () => {
    it('should return a list of waiting lists', async () => {
      const getList = await waitingListService.getWaitingList();
      expect(getList).toBeInstanceOf(Array);
    });
  });

  describe('Waiting List For Address', () => {
    it('should return a list of waitings for a specified address ', async () => {
      const getAddress = await waitingListService.getWaitingListForAddress(waitingListAddress);
      expect(getAddress).toBeInstanceOf(Array);
    });
  });

  describe('Waiting List Count', () => {
    it('should return count of lists', async () => {
      const gatWaitingList: Number = new Number(await waitingListService.getWaitingListCount());
      expect(gatWaitingList).toBeInstanceOf(Number);
    });
  });
});