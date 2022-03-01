import { NftExtendedAttributesService } from 'src/endpoints/nfts/nft.extendedattributes.service';
import { CachingService } from 'src/common/caching/caching.service';
import { EsdtModule } from 'src/endpoints/esdt/esdt.module';
import { Test } from '@nestjs/testing';
import Initializer from './e2e-init';

describe('Nft Extended Attributes Service', () => {
  let nftExtendedAttributesService: NftExtendedAttributesService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [EsdtModule],
    }).compile();

    nftExtendedAttributesService = moduleRef.get<NftExtendedAttributesService>(NftExtendedAttributesService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  it("should return extended attributes from base64", async () => {
    const attributes: string = "bWV0YWRhdGE6UW1UQjk3dkhMYkdBZnkxVDJQZFUyWE5QdXlXQjd1Znd3aFNoNU1wTENWbjEybS8zOTUuanNvbg==";
    const extendedAttributes = await nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(attributes);

    expect(extendedAttributes.description).toStrictEqual("The unique MAW NFT Collection! ");
    expect(extendedAttributes).toBeInstanceOf(Object);

    expect(extendedAttributes.hasOwnProperty("dna"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("attributes"));
    expect(extendedAttributes.hasOwnProperty("compiler"));
  });

  it("should return undefined", async () => {
    const attributes: string = "bWV0YWRhdGE6UW1UQjk3sdkhMYkdBZnkxVDJQZFUyWE5QdXlXQjd1Znd3aFNoNU1wTENWbjEybS8zOTUuanNvbg==";

    try {
      await nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(attributes);
    } catch (e) {
      expect(e).toMatch(`Could not get extended attributes from raw attributes '${attributes}'`);
    }
  });

  it("should try get extended attributes from metadata", async () => {
    const metadata: string = "QmTB97vHLbGAfy1T2PdU2XNPuyWB7ufwwhSh5MpLCVn12m/395.json";
    const extendedAttributes = await nftExtendedAttributesService.tryGetExtendedAttributesFromMetadata(metadata);

    if (!extendedAttributes) {
      throw new Error("Attributes are not defined");
    }
    expect(extendedAttributes).toBeInstanceOf(Object);
    expect(extendedAttributes.hasOwnProperty("dna"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("attributes"));
    expect(extendedAttributes.hasOwnProperty("compiler"));
  });

  it("should return undefined", async () => {
    const metadata: string = "QmTB97vHLbGAfsy1T2PdU2XNPuyWB7ufwwhSh5MpLCVn12m/395.json";

    try {
      await nftExtendedAttributesService.tryGetExtendedAttributesFromMetadata(metadata);
    } catch (e) {
      expect(e).toMatch(`Error when getting extended attributes from metadata '${metadata}'`);
    }
  });

  it("should get extended attributes from metadata", async () => {
    const metadata: string = "QmTB97vHLbGAfy1T2PdU2XNPuyWB7ufwwhSh5MpLCVn12m/395.json";
    const extendedAttributes = await nftExtendedAttributesService.getExtendedAttributesFromMetadata(metadata);

    expect(extendedAttributes.compiler).toStrictEqual("Trust Staking");
    expect(extendedAttributes).toBeInstanceOf(Object);

    expect(extendedAttributes.hasOwnProperty("dna"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("edition"));
    expect(extendedAttributes.hasOwnProperty("attributes"));
    expect(extendedAttributes.hasOwnProperty("compiler"));
  });

  it("should return undefined if result is not defined", async () => {
    jest
      .spyOn(CachingService.prototype, 'getOrSetCache')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async (_description: string) => undefined));

    const metadata: string = "QmTB97vHLbGAfy1T2PdU2XNPuyWB7ufwwhSh5MpLCVn12m/395.json";
    const extendedAttributes = await nftExtendedAttributesService.getExtendedAttributesFromMetadata(metadata);
    expect(extendedAttributes).toBeUndefined();
  });

  it("shoul return undefined ", async () => {
    const metadata: string = "QmTB97vHLbGAfy1T2PdU2XNPuyWB7ufwwhSh5MpLCVn12m/395.json";
    const extendedAttributes = await nftExtendedAttributesService.getExtendedAttributesFromBase64EncodedAttributes(metadata);

    expect(extendedAttributes).toBeUndefined();
  });

  describe("Get Tags", () => {
    it("should return tags", () => {
      const attributes: string = "bWV0YWRhdGE6UW1UQjk3dkhMYkdBZnkxVDJQZFUyWE5QdXlXQjd1Znd3aFNoNU1wTENWbjEybS8zOTUuanNvbg==";
      const tags = nftExtendedAttributesService.getTags(attributes);

      for (const tag of tags) {
        expect(typeof tag).toStrictEqual("string");
      }
    });
  });
});
