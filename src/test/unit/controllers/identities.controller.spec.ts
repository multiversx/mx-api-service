import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require('supertest');
import { mockIdentityService } from "./services.mock/identity.services.mock";
import { IdentitiesController } from "src/endpoints/identities/identities.controller";
import { PublicAppModule } from "src/public.app.module";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { IdentitySortCriteria } from "src/endpoints/identities/entities/identity.sort.criteria";

describe('IdentityController', () => {
  let app: INestApplication;
  const path: string = "/identities";
  const identitiesServiceMocks = mockIdentityService();

  beforeAll(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [IdentitiesController],
      imports: [PublicAppModule],
    })
      .overrideProvider(IdentitiesService)
      .useValue(identitiesServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /identities", () => {
    it('should return a list of all node identities', async () => {
      const mockIdentitiesList = createMockIdentitiesList(5);
      identitiesServiceMocks.getIdentities.mockResolvedValue(mockIdentitiesList);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockIdentitiesList);
          expect(response.body.length).toBe(5);
        });
    });

    it('should properly handle single sort criteria', async () => {
      const mockIdentitiesList = createMockIdentitiesList(5);
      identitiesServiceMocks.getIdentities.mockResolvedValue(mockIdentitiesList);

      await request(app.getHttpServer())
        .get(`${path}?sort=validators`)
        .expect(200)
        .expect(() => {
          expect(identitiesServiceMocks.getIdentities).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Array),
            [IdentitySortCriteria.validators]
          );
        });
    });

    it('should properly handle multiple sort criteria', async () => {
      const mockIdentitiesList = createMockIdentitiesList(5);
      identitiesServiceMocks.getIdentities.mockResolvedValue(mockIdentitiesList);

      await request(app.getHttpServer())
        .get(`${path}?sort=validators,locked`)
        .expect(200)
        .expect(() => {
          expect(identitiesServiceMocks.getIdentities).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Array),
            [IdentitySortCriteria.validators, IdentitySortCriteria.locked]
          );
        });
    });

    it('should properly handle the stake sort criterion', async () => {
      const mockIdentitiesList = createMockIdentitiesList(5);
      identitiesServiceMocks.getIdentities.mockResolvedValue(mockIdentitiesList);

      await request(app.getHttpServer())
        .get(`${path}?sort=stake`)
        .expect(200)
        .expect(() => {
          expect(identitiesServiceMocks.getIdentities).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Array),
            [IdentitySortCriteria.stake]
          );
        });
    });
  });

  describe("GET /identities/:identifier", () => {
    it('should return the details of a single identity when found', async () => {
      const mockIdentity = createMockIdentitiesList(1)[0];
      identitiesServiceMocks.getIdentity.mockResolvedValue(mockIdentity);

      await request(app.getHttpServer())
        .get(`${path}/${mockIdentity.identity}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(mockIdentity);
        });
    });

    it('should return a 404 Not Found when the identity does not exist', async () => {
      const identifier = 'nonexistent';
      identitiesServiceMocks.getIdentity.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toEqual('Identity not found');
        });
    });
  });

  describe('GET /identities/:identifier/avatar', () => {
    it('should redirect to the avatar of a specific identity when found', async () => {
      const identifier = 'multiversx';
      const avatarUrl = 'http://example.com/avatar.png';
      identitiesServiceMocks.getIdentityAvatar.mockResolvedValue(avatarUrl);

      await request(app.getHttpServer())
        .get(`/identities/${identifier}/avatar`)
        .expect(302)
        .expect('Location', avatarUrl);
    });

    it('should return a 404 Not Found when the avatar does not exist', async () => {
      const identifier = 'nonexistent';
      identitiesServiceMocks.getIdentityAvatar.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/identities/${identifier}/avatar`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toEqual('Identity avatar not found');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function createMockIdentitiesList(numberOfIdentities: number) {
    return Array.from({ length: numberOfIdentities }, (_, index) => ({
      identity: "multiversx" + (index ? `_${index}` : ''),
      name: `Name ${index}`,
      description: `Description for identity ${index}`,
      avatar: "https://raw.githubusercontent.com/multiversx/mx-assets/master/identities/multiversx/logo.png",
      website: "http://multiversx.com",
      twitter: `@identity${index} `,
      location: `Location ${index} `,
      score: 636.0000000000013,
      validators: 530,
      stake: "1325000000000000000000000",
      topUp: "1709999999999999983222620",
      locked: "3034999999999999983222620",
      distribution: { 'direct': 1 },
      providers: [`provider${index} `],
      stakePercent: 17.83,
      rank: index + 1,
      apr: 7.54,
    }));
  }
});
