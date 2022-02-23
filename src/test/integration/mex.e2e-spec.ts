import { CachingService } from 'src/common/caching/caching.service';
import { Test } from "@nestjs/testing";
import { MexService } from "../../endpoints/mex/mex.service";
import userAccount from "../data/accounts/user.account";
import { MexWeek } from "src/endpoints/mex/entities/mex.week";
import '../../utils/extensions/jest.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('Mex Service', () => {
  let mexService: MexService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    mexService = moduleRef.get<MexService>(MexService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('Get Mex For Address', () => {
    it(`should return total mex amount for address' `, async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        .mockImplementation(jest.fn((_address, promise: any) => promise()));

      const mexWeeks = await mexService.getMexForAddress(userAccount.address);

      for (const mexWeek of mexWeeks) {
        expect(mexWeek).toHaveStructure(Object.keys(new MexWeek()));
      }
    });
  });

  describe('Get Mex For Address Raw', () => {
    it(`should return total mex amount for address raw'`, async () => {
      const mexWeeks = await mexService.getMexForAddressRaw(userAccount.address);

      for (const mexWeek of mexWeeks) {
        expect(mexWeek).toHaveStructure(Object.keys(new MexWeek()));
      }
    });
  });
});
