import { TagService } from "../../endpoints/nfttags/tag.service";
import { Test } from "@nestjs/testing";
import { Tag } from "../../endpoints/nfttags/entities/tag";
import '@elrondnetwork/erdnest/lib/utils/extensions/jest.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('NFT Tag Service', () => {
  let tagService: TagService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tagService = moduleRef.get<TagService>(TagService);

  });

  describe('getNftTags', () => {
    it(`should return list of tags for 2 nft`, async () => {
      const tags = await tagService.getNftTags({ from: 0, size: 2 });

      expect(tags).toHaveLength(2);

      for (const tag of tags) {
        expect(tag).toHaveStructure(Object.keys(new Tag()));
      }
    });

    it(`should return list of tags for 2 nft`, async () => {
      const tags = await tagService.getNftTags({ from: 0, size: 2 });

      expect(tags).toHaveLength(2);

      for (const tag of tags) {
        expect(tag).toHaveStructure(Object.keys(new Tag()));
      }
    });

    it(`should return list of tags for 2 nft`, async () => {
      const tags = await tagService.getNftTags({ from: 0, size: 2 });

      expect(tags).toHaveLength(2);

      for (const tag of tags) {
        expect(tag).toHaveStructure(Object.keys(new Tag()));
      }
    });

  });


  describe('getNftTagsRaw', () => {
    it(`should return a list of tags raw for 2 nft`, async () => {
      const tagsRaw = await tagService.getNftTagsRaw({ from: 0, size: 2 });

      for (const tag of tagsRaw) {
        expect(tag).toHaveStructure(Object.keys(new Tag()));
      }
      expect(tagsRaw).toHaveLength(2);
    });
  });


  describe('Get Nft Tag', () => {
    it('should return a specific tag', async () => {
      const tag = await tagService.getNftTag('elrond');
      expect(tag.tag).toStrictEqual('elrond');
    });
  });
});
