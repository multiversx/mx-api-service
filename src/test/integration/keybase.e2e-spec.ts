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
  let cachedIdentityProfiles: any[], keybasePubIdentityProfiles: any[];

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

    cachedIdentityProfiles = await keybaseService.getCachedIdentityProfilesKeybases();
    keybasePubIdentityProfiles = await keybaseService.getIdentitiesProfilesAgainstKeybasePub();

    console.log({cachedKeybases: cachedKeybases['fff338ce7ac423023d66ee1d55ac69e4588b52a4fcf54b0a240afed7b55ef33169b5758f6a1f36e79769548c6bdf940ea195ce0fc12cc0e03fc9da8f51582dad6753db76243e542872a725585127e700da167f223a22154360daf22973dbb198'], 
    keybasePubKeybases: keybasePubKeybases['fff338ce7ac423023d66ee1d55ac69e4588b52a4fcf54b0a240afed7b55ef33169b5758f6a1f36e79769548c6bdf940ea195ce0fc12cc0e03fc9da8f51582dad6753db76243e542872a725585127e700da167f223a22154360daf22973dbb198']})
  }, Constants.oneHour() * 1000);

  it('cached keybases should be in sync with keybase pub', async () => {
    expect(Object.keys(cachedKeybases).length).toStrictEqual(Object.keys(keybasePubKeybases).length);
    expect(Object.keys(cachedKeybases)).toStrictEqual(Object.keys(keybasePubKeybases));
    expect(cachedKeybases).toStrictEqual(keybasePubKeybases);
  });

  it('cached identity profiles should be in sync with keybase pub', async () => {
    expect(cachedIdentityProfiles.length).toStrictEqual(keybasePubIdentityProfiles.length);
    expect(cachedIdentityProfiles).toStrictEqual(keybasePubIdentityProfiles);
  });

  it('it should return cached keybases if keybase.pub is down', async () => {
    const { status } = await apiService.head('https://keybase.pub');
    
    if (status === 200) {
      expect(cachedKeybases).toStrictEqual(keybasePubKeybases);
      expect(cachedIdentityProfiles).toStrictEqual(keybasePubIdentityProfiles);
    }
  })
});
