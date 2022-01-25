import { AccountService } from "../../endpoints/accounts/account.service";
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { MexService } from "../../endpoints/mex/mex.service";

describe('Mex Service', () => {
  let mexService: MexService;
  let accountService: AccountService;
  let accountAddress: string;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    mexService = moduleRef.get<MexService>(MexService);
    accountService = moduleRef.get<AccountService>(AccountService);

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;
  }, Constants.oneHour() * 1000);


  describe('Get Mex For Address', () => {
    it(`should return MexWeek[] for address 'accountAddress' `, async () => {
      const mexValues = await mexService.getMexForAddress(accountAddress);
      expect(mexValues).toBeInstanceOf(Array);
    });
    it('should return a detailed account with accountAddress', async () => {
      const mexValues = await mexService.getMexForAddress(accountAddress);
      expect(mexValues).toBeDefined();
    });
  });

  describe('Get Mex For Address Raw', () => {
    it(`should return MexWeek[] for address raw 'accountAddress'`, async () => {
      const mexValues = await mexService.getMexForAddressRaw(accountAddress);
      expect(mexValues).toBeInstanceOf(Array);
    });
    it('should return a detailed raw account with accountAddress', async () => {
      const mexValues = await mexService.getMexForAddressRaw(accountAddress);
      expect(mexValues).toBeDefined();
    });
  });
});