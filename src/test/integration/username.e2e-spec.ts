import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {UsernameService} from "../../endpoints/usernames/username.service";

describe('Username Service', () => {
  let usernameService: UsernameService;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    usernameService = publicAppModule.get<UsernameService>(UsernameService);

  }, Constants.oneHour() * 1000);

  describe('Get Username Address Raw', () => {
    it('returns address based on username', async () => {
      const returnAddress = await usernameService.getUsernameAddressRaw('alice');
      expect(returnAddress).toBe('erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz');
    });
    it('returns null if username is not added ', async () => {
      const returnAddress = await usernameService.getUsernameAddressRaw('');
      expect(returnAddress).toBeNull();
    });
  });
});