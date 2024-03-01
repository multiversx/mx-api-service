import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Tag } from "src/endpoints/nfttags/entities/tag";
import { TagService } from "src/endpoints/nfttags/tag.service";
import request = require('supertest');
import { TagController } from "src/endpoints/nfttags/tag.controller";
import { TagModule } from "src/endpoints/nfttags/tag.module";
import { QueryPagination } from "src/common/entities/query.pagination";

describe('TagController', () => {
  let app: INestApplication;
  const path: string = "/tags";

  const tagService = {
    getNftTags: jest.fn(),
    getNftTagCount: jest.fn(),
    getNftTag: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TagController],
      imports: [TagModule],
    })
      .overrideProvider(TagService)
      .useValue(tagService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET tags`, async () => {
    const mockTags: Tag[] = [{ tag: 'multiversx', count: 48974 }, { tag: 'xPortal', count: 34750 }];
    tagService.getNftTags.mockResolvedValue(mockTags);

    const params = new URLSearchParams({ from: '0', size: '2' }).toString();

    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(200)
      .expect(mockTags);

    expect(tagService.getNftTags).toHaveBeenCalledWith(
      new QueryPagination({ from: 0, size: 2 }), undefined);
  });

  it(`/GET tags/count`, async () => {
    tagService.getNftTagCount.mockResolvedValue(10);

    await request(app.getHttpServer())
      .get(`${path}/count`)
      .expect(200)
      .expect(response => {
        expect(+response.text).toBeGreaterThanOrEqual(10);
      });
  });

  it(`/GET tags/:tag`, async () => {
    const mockTag: Tag = { tag: 'Art', count: 1 };
    tagService.getNftTag.mockResolvedValue(mockTag);

    await request(app.getHttpServer())
      .get(`${path}/Art`)
      .expect(200)
      .expect(mockTag);

    expect(tagService.getNftTag).toHaveBeenCalledWith("Art");
  });

  it(`/GET tags/:tag - not found`, async () => {
    tagService.getNftTag.mockRejectedValue(new Error('Nft tag not found'));

    await request(app.getHttpServer())
      .get('/tags/invalidTag')
      .expect(404);
  });

  it('/GET tags with invalid integer parameters', async () => {
    const params = new URLSearchParams({ from: 'invalid', size: '1' }).toString();
    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(400)
      .expect(response => {
        expect(response.body.message).toStrictEqual("Validation failed for argument 'from' (optional number is expected)");
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
