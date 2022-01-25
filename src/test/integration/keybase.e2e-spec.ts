import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {KeybaseService} from "../../common/keybase/keybase.service";
import {Keybase} from "../../common/keybase/entities/keybase";

describe('Keybase Service', () => {
  let keybaseService: KeybaseService;

  const identity: string = 'cryptoshigo';

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();


    keybaseService = moduleRef.get<KeybaseService>(KeybaseService);

  }, Constants.oneHour() * 1000);

  describe('Confirm KeyBase Against Cache', () => {
    it(`should confirm base against cache and return Key base Object`, async () => {
      const confirmKey = await keybaseService.confirmKeybasesAgainstCache();
      expect(confirmKey).toBeInstanceOf(Object);
    });
  });

  describe('Get Identities Profiles Against Cache', () => {
    it(`should return identities profiles`, async () => {
      const profiles = await keybaseService.getIdentitiesProfilesAgainstCache();
      expect(profiles).toBeInstanceOf(Array);
    });
  });

  describe('Get Identities Profiles Against Cache', () => {
    it(`should return identities profiles`, async () => {
      const profiles = await keybaseService.getIdentitiesProfilesAgainstCache();
      expect(profiles).toBeInstanceOf(Array);
    });
  });

  describe('Get Cached Identity Profiles Keybases', () => {
    it(`should return cached identities profiles`, async () => {
      const profiles = await keybaseService.getCachedIdentityProfilesKeybases();
      expect(profiles).toBeInstanceOf(Array);
    });
  });

  describe('Get Cached Nodes And Providers Keybases', () => {
    it(`should return cached nodes identities`, async () => {
      const nodes = await keybaseService.getCachedNodesAndProvidersKeybases();
      expect(nodes).toBeInstanceOf(Object);
    });
  });

  describe('is Keybase Pub Up', () => {
    it(`verify is keybase is pub up`, async () => {
      try{
        const key = await keybaseService.isKeybasePubUp();
        expect(key).toBeTruthy();
      }catch (err){
        expect(err).toBeFalsy();
      }
    });
  });

  describe('is Keybase Io Up', () => {
    it(`verify is keybase is Io up`, async () => {
      try{
        const key = await keybaseService.isKeybaseIoUp();
        expect(key).toBeTruthy();
      }catch (err){
        expect(err).toBeFalsy();
      }
    });
  });

  describe('Confirm Keybase', () => {
    it('should confirm Keybase', async () => {
      const keybase = new Keybase();
      keybase.identity = identity;
      const key = await keybaseService.confirmKeybase(keybase);
      expect(key).toBeTruthy();
    });
  });

  describe('Get Profile', () => {
    it('should return identity profile', async () => {
      const profile = await keybaseService.getProfile(identity);
      expect(profile).toBeInstanceOf(Object);
      expect(profile).toHaveProperty('avatar');
      expect(profile).toHaveProperty('identity');
      expect(profile).toHaveProperty('name');
    });
  });
});