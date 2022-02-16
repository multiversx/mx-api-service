import { TagService } from "../../endpoints/nfttags/tag.service";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Tag } from "../../endpoints/nfttags/entities/tag";

describe('NFT Tag Service', () => {
  let tagService: TagService;

  beforeAll(async () => {


    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tagService = moduleRef.get<TagService>(TagService);

  });

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
      const tag = await tagService.getNftTag('RWxyb25k'); //Base64 encoded string (Elrond)
      expect(tag).toHaveStructure(Object.keys(new Tag()));
    });
  });
});
