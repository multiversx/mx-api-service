import { MiniBlockController } from '../../../endpoints/miniblocks/mini.block.controller';
import { HttpException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Miniblocks Controller", () => {
  let app: INestApplication;
  let miniBlockController: MiniBlockController;
  const route: string = "/miniblocks";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    miniBlockController = moduleRef.get<MiniBlockController>(MiniBlockController);

    await app.init();
  });

  it("/miniblocks/:miniBlockHash - should return 200 status code and miniblock details", async () => {
    const miniblock: string = "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c";

    await request(app.getHttpServer())
      .get(route + "/" + miniblock)
      .expect(200);
  });

  it("/miniblocks/:miniBlockHash - should return 404 status code Error: Bad Request", async () => {
    const miniblock: string = "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4cT";

    await request(app.getHttpServer())
      .get(route + "/" + miniblock)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Miniblock not found");
      });
  });

  it("should return block details based on miniBlockHash", async () => {
    const hash: string = "4ab87e21dcf63f3d88f64e8228f001232ff29585ad475e20211ead04f1f700cc";
    const results = await miniBlockController.getBlock(hash);

    expect(results.hasOwnProperty("miniBlockHash")).toBeTruthy();
    expect(results.hasOwnProperty("receiverBlockHash")).toBeTruthy();
    expect(results.hasOwnProperty("receiverShard")).toBeTruthy();
    expect(results.hasOwnProperty("senderBlockHash")).toBeTruthy();
    expect(results.hasOwnProperty("senderShard")).toBeTruthy();
    expect(results.hasOwnProperty("timestamp")).toBeTruthy();
    expect(results.hasOwnProperty("type")).toBeTruthy();
  });

  it("should throw HttpException with HttpStatus: Not Found", async () => {
    const hash: string = "4ab87e21dcf63f3d88f64e8228f001232ff29585ad475e20211ead04f1f700ccT";

    await expect(miniBlockController.getBlock(hash)).rejects.toThrow(
      HttpException,
    );
  });
});
