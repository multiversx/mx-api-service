import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { MexService } from "../../endpoints/mex/mex.service";
import userAccount from "../mocks/accounts/userAccount";
import mex from "../mocks/esdt/token/mexToken";

describe('Mex Service', () => {
  let mexService: MexService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    mexService = moduleRef.get<MexService>(MexService);

  }, Constants.oneDay() * 1000);


  describe('Get Mex For Address', () => {
    it(`should return total mex amount for address' `, async () => {
      const mexValues = await mexService.getMexForAddress(userAccount.address);

      expect(mexValues).toEqual(
        expect.arrayContaining(
        [expect.objectContaining({mex: mex[0].mex})]
      ));
    });

    it('should return total mex amount per day for address', async () => {
      const mexValues = await mexService.getMexForAddress(userAccount.address);

      expect(mexValues).toEqual(
        expect.arrayContaining(
        [expect.objectContaining({mex: mex[0].days[0].balance})]
      ));
    });
  });

  describe('Get Mex For Address Raw', () => {
    it(`should return total mex amount for address raw'`, async () => {
      const mexRaw = await mexService.getMexForAddressRaw(userAccount.address);

      expect(mexRaw).toEqual(
        expect.arrayContaining(
          [expect.objectContaining({mex: mex[0].mex})]
        ));
    });

    it('should return total mex amount per day for address raw', async () => {
      const mexRaw = await mexService.getMexForAddressRaw(userAccount.address);

      expect(mexRaw).toEqual(
        expect.arrayContaining(
          [expect.objectContaining({mex: mex[0].days[0].balance})]
        ));
    });
  });
});
