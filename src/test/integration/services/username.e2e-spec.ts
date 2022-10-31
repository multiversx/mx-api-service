import { Test } from "@nestjs/testing";
import { UsernameModule } from "src/endpoints/usernames/username.module";
import { ApiService } from '@elrondnetwork/erdnest';
import { UsernameService } from "src/endpoints/usernames/username.service";

describe('Username Service', () => {
  let usernameService: UsernameService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsernameModule],
    }).compile();

    usernameService = moduleRef.get<UsernameService>(UsernameService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('getUsernameForAddressRaw', () => {
    it('should return address username', async () => {
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await usernameService.getUsernameForAddressRaw(address);

      expect(results).toStrictEqual('alice.elrond');
    });

    it('should return null because test simulates that address does not contains an usernmae', async () => {
      jest.spyOn(ApiService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => null);

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await usernameService.getUsernameForAddressRaw(address);

      expect(results).toStrictEqual(null);
    });
  });


  describe('getAddressForUsername', () => {
    it('should return bech32 address based on a username', async () => {
      const username: string = 'alice';
      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await usernameService.getAddressForUsername(username);

      expect(results).toStrictEqual(address);
    });

    it('should return null because test simulates that returned username is not valid', async () => {
      jest.spyOn(ApiService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => null);

      const username: string = 'alice.elrond';
      const results = await usernameService.getAddressForUsername(username);

      expect(results).toStrictEqual(null);
    });
  });
});
