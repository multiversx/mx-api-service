import { NftExtendedAttributesService } from 'src/endpoints/nfts/nft.extendedattributes.service';
import { PublicAppModule } from "src/public.app.module";
import { Test } from '@nestjs/testing';
import { ElrondCachingService } from '@multiversx/sdk-nestjs';

describe('Nft Extended Attributes Service', () => {
  let nftExtendedAttributesService: NftExtendedAttributesService;

  const attributes = {
    description: 'The unique MAW NFT Collection! ',
    dna: '7eb2a6d3e1e0c93c5920a941744bd38a547858de',
    edition: 395,
    createdAt: 1639180014636,
    attributes: [
      { trait_type: 'Background', value: '10' },
      { trait_type: 'Body', value: 'Suit_1' },
      { trait_type: 'Mouth', value: 'Mouth_Jail' },
      { trait_type: 'Head', value: 'Head_Trib' },
      { trait_type: 'Left Eye', value: 'EyeL_Metalic_Black' },
      { trait_type: 'Right Eye', value: 'EyeR_Yellow' },
      { trait_type: 'Left Ear', value: 'EarL_Metalic_Gold' },
      { trait_type: 'Right Ear', value: 'EarR_Metalic_Black' },
      { trait_type: 'Drops', value: 'Drop3' },
    ],
    compiler: 'Trust Staking',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftExtendedAttributesService = moduleRef.get<NftExtendedAttributesService>(NftExtendedAttributesService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("tryGetExtendedAttributesFromBase64EncodedAttributes", () => {
    it("should return attributes from base64 encoded", async () => {
      jest
        .spyOn(ElrondCachingService.prototype, 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_attributes: string) => {
          return Object.assign({}, attributes);
        }));

      const results = await nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes('bWV0YWRhdGE6UW1UQjk3dkhMYkdBZnkxVDJQZFUyWE5QdXlXQjd1Znd3aFNoNU1wTENWbjEybS8zOTUuanNvbg==');
      expect(results.attributes).toBeDefined();
      expect(results).toEqual(expect.objectContaining({
        attributes: expect.arrayContaining([
          expect.objectContaining({
            trait_type: 'Background', value: '10',
          }),
        ]),
      }));
    });

    it("should return undefined because test simulates that attributes are not defined", async () => {
      jest
        .spyOn(ElrondCachingService.prototype, 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_attributes: string) => {
          const response = Object.assign({}, attributes);
          response.attributes = [];
          return response;
        }));

      const results = await nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes('');
      expect(results).toBeUndefined();
    });
    //ToDo catch(error)
  });

  describe("getTags", () => {
    it("should return tags based on attributes", () => {
      const attributes: string = "dGFnczpFbHJvbmQsUm9ib3RzLFJvYm90LGVSb2JvdHM=";
      const tags = nftExtendedAttributesService.getTags(attributes);

      expect(tags).toStrictEqual(['Elrond', 'Robots', 'Robot', 'eRobots']);
    });

    it("should return undefined because test simulates that attributes are not defined", () => {
      const attributes: string = "bWV0YWRhdGE6UW1UQjk3dkhMYkdBZnkxVDJQZFUyWE5QdXlXQjd1Znd3aFNoNU1wTENWbjEybS8zOTUuanNvbg==";
      const tags = nftExtendedAttributesService.getTags(attributes);
      expect(tags).toStrictEqual([]);
    });
  });
});
