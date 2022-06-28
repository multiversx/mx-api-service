import { VmQueryService } from '../../endpoints/vm.query/vm.query.service';
import { Test } from "@nestjs/testing";
import { UsernameService } from "../../endpoints/usernames/username.service";
import { UsernameModule } from "src/endpoints/usernames/username.module";
import { CachingService } from '@elrondnetwork/nestjs-microservice-common';

describe('Username Service', () => {
  let usernameService: UsernameService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsernameModule],
    }).compile();

    usernameService = moduleRef.get<UsernameService>(UsernameService);
  });

  describe('Get Username Address Raw', () => {
    it('should return username address in bech32', async () => {

      jest.spyOn(CachingService.prototype, 'getCacheLocal')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => undefined);

      jest.spyOn(CachingService.prototype, 'getCacheRemote')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => undefined);

      jest
        .spyOn(VmQueryService.prototype, 'vmQuery')
        .mockImplementation(jest.fn(async (
          _contract: string,
          _func: string,
          _caller: string | undefined,
          _args: string[] | undefined,
          _value: string | undefined,
          // eslint-disable-next-line require-await
          _skipCache: boolean | undefined) => ['AjvhZf98cXSgfH9ipxgJUpWpiGaZLiyMv98aC8kE8TA=']));


      const results = await usernameService.getUsernameAddressRaw('alice.elrond');
      expect(results).toStrictEqual('erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz');
    });

    it("should return null because because test simulate that it cannot create an address from invalid base64", async () => {

      jest.spyOn(CachingService.prototype, 'getCacheLocal')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => undefined);

      jest.spyOn(CachingService.prototype, 'getCacheRemote')
        // eslint-disable-next-line require-await
        .mockImplementation(async () => undefined);

      jest
        .spyOn(VmQueryService.prototype, 'vmQuery')
        .mockImplementation(jest.fn(async (
          _contract: string,
          _func: string,
          _caller: string | undefined,
          _args: string[] | undefined,
          _value: string | undefined,
          // eslint-disable-next-line require-await
          _skipCache: boolean | undefined) => ['AjvhZf98cXSgfH9ipxgJUpWpiGaZLiyMv98aC8kE8TTEST=']));

      const results = await usernameService.getUsernameAddressRaw('alice.elrond');
      expect(results).toStrictEqual(null);
    });
  });
});
