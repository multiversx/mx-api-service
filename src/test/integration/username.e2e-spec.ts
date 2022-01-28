import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { UsernameService } from "../../endpoints/usernames/username.service";
import userAccount from "../mocks/accounts/userAccount";

describe('Username Service', () => {
  let usernameService: UsernameService;
  const usernameWithNoAddress: string = 'erd1wh9c0sjr2xn8hzf02lwwcr4jk2s84tat9ud2kaq6zr7xzpvl9l5q8awmex';

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    usernameService = publicAppModule.get<UsernameService>(UsernameService);

  }, Constants.oneHour() * 1000);

  describe('Get Username Address Raw', () => {
    it('returns username address', async () => {
      const address = await usernameService.getUsernameAddressRaw(userAccount.usernameRaw);
      expect(address).toBe(userAccount.address);
    });
    it('returns null if username is not added ', async () => {
      const result = await usernameService.getUsernameAddressRaw(usernameWithNoAddress);
      expect(result).toBeNull();
    });
  });
});