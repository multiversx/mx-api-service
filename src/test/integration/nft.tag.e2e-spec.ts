import {TagService} from "../../endpoints/nfttags/tag.service";
import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";

describe('NFT Tag Service', () => {
  let tagService: TagService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tagService = moduleRef.get<TagService>(TagService);

  }, Constants.oneHour() * 1000);

  test(`should return list of tags for 1 nft`, async () => {
    const nftTags = await tagService.getNftTags({from: 0, size: 1});

    for (const nft of nftTags) {
      expect(nft).toBeInstanceOf(Object);
      expect.assertions(1);
    }
  });

  test(`should return tags for a list with 10 nfts`, async () => {
    const nftTags = await tagService.getNftTags({from: 0, size: 10});

    for (const nft of nftTags) {
      expect(nft).toBeInstanceOf(Object);
      expect.assertions(1);
    }
  });

  test(`should verify if tags contain properties`, async () => {
    const nftTags = await tagService.getNftTags({from: 0, size: 10});

    for (const nft of nftTags) {
      expect(nft).toHaveProperty('tag');
      expect(nft).toHaveProperty('count');
    }
  });

  test(`should return a list of tags for 1 nft`, async () => {
    const nftTagsRaw = await tagService.getNftTagsRaw({from: 0, size: 1});

    for (const nft of nftTagsRaw) {
      expect(nft).toBeInstanceOf(Object);
      expect.assertions(1);
    }
  });

  test(`should return a list of tags for 10 nfts`, async () => {
    const nftTagsRaw = await tagService.getNftTagsRaw({from: 0, size: 10});

    for (const nft of nftTagsRaw) {
      expect(nft).toBeInstanceOf(Object);
      expect.assertions(10);
    }
  });

  test(`should verify if tags contain properties`, async () => {
    const nftTagsRaw = await tagService.getNftTagsRaw({from: 0, size: 10});

    for (const nft of nftTagsRaw) {
      expect(nft).toHaveProperty('tag');
      expect(nft).toHaveProperty('count');
    }
  });
});