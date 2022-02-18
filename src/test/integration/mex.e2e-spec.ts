import { Test } from "@nestjs/testing";
import { MexService } from "../../endpoints/mex/mex.service";
import userAccount from "../data/accounts/user.account";
import { MexWeek } from "src/endpoints/mex/entities/mex.week";
import { MexModule } from "src/endpoints/mex/mex.module";
import '../../utils/extensions/jest.extensions';

describe('Mex Service', () => {
  let mexService: MexService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MexModule],
    }).compile();

    mexService = moduleRef.get<MexService>(MexService);
  });


  describe('Get Mex For Address', () => {
    it(`should return total mex amount for address' `, async () => {
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
