import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require('supertest');
import { MediaController } from "src/endpoints/media/media.controller";
import { PublicAppModule } from "src/public.app.module";
import { MediaService } from "src/endpoints/media/media.service";

describe('MediaController', () => {
  let app: INestApplication;
  const path: string = "/media";

  const mediaService = {
    getRedirectUrl: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController],
      imports: [PublicAppModule],
    })
      .overrideProvider(MediaService)
      .useValue(mediaService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET media/:uri(*)`, async () => {
    const mockUrl = 'https://s3.amazonaws.com/media.elrond.com/nfts/thumbnail/XPACHIEVE-5a0519-e302a15d';

    mediaService.getRedirectUrl.mockResolvedValue(mockUrl);

    await request(app.getHttpServer())
      .get(`${path}/nfts/thumbnail/XPACHIEVE-5a0519-e302a15d`)
      .expect(200)
      .expect('content-type', 'image/jpeg')
      .expect('cache-control', 'max-age=60')
      .expect('Access-Control-Allow-Origin', '*');

    expect(mediaService.getRedirectUrl).toHaveBeenCalled();
  });

  it(`/GET media/:uri(*) - not found`, async () => {
    mediaService.getRedirectUrl.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .get(`${path}/nfts/thumbnail/XPACHIEVE-5a0519-e302a15d`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
