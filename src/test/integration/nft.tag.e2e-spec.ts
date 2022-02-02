import { TagService } from "../../endpoints/nfttags/tag.service";
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";

describe('NFT Tag Service', () => {
  let tagService: TagService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tagService = moduleRef.get<TagService>(TagService);

  }, Constants.oneHour() * 1000);

  it(`should return list of tags for 1 nft`, async () => {
    const tags = await tagService.getNftTags({ from: 0, size: 1 });

    for (const tag of tags) {
      expect(tag).toBeInstanceOf(Object);
    }
  });

  it(`should verify if tags contain properties`, async () => {
    const tags = await tagService.getNftTags({ from: 0, size: 10 });

    for (const tag of tags) {
      expect(tag).toHaveProperty('tag');
      expect(tag).toHaveProperty('count');
    }
  });

  it(`should return a list of tags for 1 nft`, async () => {
    const tagsRaw = await tagService.getNftTagsRaw({ from: 0, size: 1 });

    for (const tag of tagsRaw) {
      expect(tag).toBeInstanceOf(Object);
      expect.assertions(1);
    }
  });

  it(`should verify if tags contain properties`, async () => {
    const tagsRaw = await tagService.getNftTagsRaw({ from: 0, size: 10 });

    for (const tag of tagsRaw) {
      expect(tag).toHaveProperty('tag');
      expect(tag).toHaveProperty('count');
    }
  });

  describe('Get Nft Tag', () => {
    it('should return tag', async () => {
      const tag = await tagService.getNftTag('RWxyb25k');
      expect(tag).toBeInstanceOf(Object);
    });
  });
});
