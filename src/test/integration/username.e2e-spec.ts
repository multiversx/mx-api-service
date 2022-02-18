import { Test } from "@nestjs/testing";
import { UsernameService } from "../../endpoints/usernames/username.service";
import userAccount from "../data/accounts/user.account";
import { UsernameModule } from "src/endpoints/usernames/username.module";

describe('Username Service', () => {
  let usernameService: UsernameService;
  const usernameWithNoAddress: string = 'invalidUsername';

  beforeAll(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [UsernameModule],
    }).compile();

    usernameService = publicAppModule.get<UsernameService>(UsernameService);
  });

  describe('Get Username Address Raw', () => {
    it('returns username address', async () => {
      const address = await usernameService.getUsernameAddressRaw(userAccount.usernameRaw);
      expect(address).toBe(userAccount.address);
    });

    it('returns null if username is not added ', async () => {
      const address = await usernameService.getUsernameAddressRaw(usernameWithNoAddress);
      expect(address).toBeNull();
    });
  });
});
