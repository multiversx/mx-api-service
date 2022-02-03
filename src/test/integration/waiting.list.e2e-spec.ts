import { WaitingListService } from "../../endpoints/waiting-list/waiting.list.service";
import Initializer from "./e2e-init";
import { Constants } from "../../utils/constants";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import {WaitingList} from "../../endpoints/waiting-list/entities/waiting.list";

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
      const list = await waitingListService.getWaitingList();

      for (const item of list) {
        expect(item).toHaveStructure(Object.keys(new WaitingList()));
      }
    });
  });

  describe('Waiting List For Address', () => {
    it('should return a list of waitings for a specified address ', async () => {
      const list = await waitingListService.getWaitingListForAddress(waitingListAddress);

      for (const item of list) {
        expect(item).toHaveStructure(Object.keys(new WaitingList()));
      }
    });
  });

  describe('Waiting List Count', () => {
    it('should return count of lists', async () => {
      const gatWaitingList = await waitingListService.getWaitingListCount();
      expect(typeof gatWaitingList).toBe('number');
    });
  });
});
