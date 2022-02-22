import { DatabaseService } from '../../common/persistence/database/database.service';
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Database Service', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    databaseService = moduleRef.get<DatabaseService>(DatabaseService);

  }, Constants.oneHour() * 1000);

  it("should return metadata based on identifier from nft_metadata", async () => {
    const identifier: string = "000-97bd6d-01";
    const metadata = await databaseService.getMetadata(identifier);

    expect(metadata).toBeInstanceOf(Object);
    expect(metadata.hasOwnProperty("name")).toBeTruthy();
    expect(metadata.hasOwnProperty("tags")).toBeTruthy();
    expect(metadata.hasOwnProperty("fileUri")).toBeTruthy();
    expect(metadata.hasOwnProperty("fileName")).toBeTruthy();
    expect(metadata.hasOwnProperty("fileType")).toBeTruthy();
    expect(metadata.hasOwnProperty("attributes")).toBeTruthy();
    expect(metadata.hasOwnProperty("description")).toBeTruthy();
  });

  it("should return metadata from nft_metadata", async () => {
    const identifiers: string[] = ["000-97bd6d-01", "001-5e107d-03", "001-5e107d-04"];
    const metadata = await databaseService.batchGetMetadata(identifiers);

    expect(metadata).toBeInstanceOf(Object);
  });

  it("should return media from nft_media", async () => {
    const identifier: string = "001-5e107d-03";
    const results = await databaseService.getMedia(identifier);

    if (!results) {
      throw new Error("Media properties are not defined");
    }

    for (const result of results) {
      expect(result.hasOwnProperty("url")).toBeTruthy();
      expect(result.hasOwnProperty("fileSize")).toBeTruthy();
      expect(result.hasOwnProperty("fileType")).toBeTruthy();
      expect(result.hasOwnProperty("originalUrl")).toBeTruthy();
      expect(result.hasOwnProperty("thumbnailUrl")).toBeTruthy();
    }
  });

  it("should return null if identifier is undefined", async () => {
    const identifier: string = "001-5e107d-99";
    const results = await databaseService.getMedia(identifier);

    expect(results).toBeNull();
  });

  it("should return media based on identifiers from nft_media", async () => {
    const identifiers: string[] = ["001-5e107d-03", "001-5e107d-04", "1000-59d420-01"];
    const results = await databaseService.batchGetMedia(identifiers);

    if (!results) {
      throw new Error("Media properties are not defined");
    }
    expect(results).toBeInstanceOf(Object);
  });
});
