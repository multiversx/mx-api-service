import { TagService } from "../../endpoints/nfttags/tag.service";
import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { Tag } from "../../endpoints/nfttags/entities/tag";

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
    expect(tags.length).toStrictEqual(1);

    for (const tag of tags) {
      expect(tag).toHaveStructure(Object.keys(new Tag()));
    }
  });

  it(`should return a list of tags raw for 1 nft`, async () => {
    const tagsRaw = await tagService.getNftTagsRaw({ from: 0, size: 1 });
    expect(tagsRaw.length).toBe(1);

    for (const tag of tagsRaw) {
      expect(tag).toHaveStructure(Object.keys(new Tag()));
    }
  });

  describe('Get Nft Tag', () => {
    it('should return tag', async () => {
      const tag = await tagService.getNftTag('Warrior');
      expect(tag).toHaveStructure(Object.keys(new Tag()));
    });
  });
});
