import { Test } from "@nestjs/testing";
import { ApiService } from "src/common/api.service";
import { KeybaseService } from "src/common/keybase.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Keybase Service', () => {
  let keybaseService: KeybaseService;
  let apiService: ApiService;
  let cachedKeybases: any, keybasePubKeybases: any;

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    keybaseService = publicAppModule.get<KeybaseService>(KeybaseService);
    apiService = publicAppModule.get<ApiService>(ApiService);
    cachedKeybases = await keybaseService.confirmKeybasesAgainstCache();
    keybasePubKeybases = await keybaseService.confirmKeybasesAgainstKeybasePub();
  }, Constants.oneHour() * 1000);

  it('cached keybases should be in sync with keybase pub', async () => {
    expect(Object.keys(cachedKeybases).length).toStrictEqual(Object.keys(keybasePubKeybases).length);
    expect(Object.keys(cachedKeybases)).toStrictEqual(Object.keys(keybasePubKeybases));
    expect(cachedKeybases).toStrictEqual(keybasePubKeybases);
  });

  it('it should return cached keybases if keybase.pub is down', async () => {
    const { status } = await apiService.head('https://keybase.pub');
    
    if (status === 200) {
      expect(cachedKeybases).toStrictEqual(keybasePubKeybases);
    }
  })
});
