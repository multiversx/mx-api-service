import { Test } from "@nestjs/testing";
import { KeybaseIdentity } from "src/common/keybase/entities/keybase.identity";
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/jest.extensions';
import { PublicAppModule } from "src/public.app.module";
import { KeybaseService } from "src/common/keybase/keybase.service";

describe('Keybase Service', () => {
  let keybaseService: KeybaseService;

  const identity: string = 'cryptoshigo';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    keybaseService = moduleRef.get<KeybaseService>(KeybaseService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('Get Profile', () => {
    it('should return identity profile', () => {
      const profile = keybaseService.getProfile(identity);

      expect(profile).toHaveStructure(Object.keys(new KeybaseIdentity()));
    });
  });
});
