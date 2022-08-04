import { ApiModule } from "@elrondnetwork/erdnest";
import { Module } from "@nestjs/common";
import { AWSService } from "../thumbnails/aws.service";
import { NftAssetService } from "./nft.asset.service";

@Module({
  imports: [ApiModule],
  providers: [NftAssetService, AWSService],
  exports: [NftAssetService],
})
export class NftAssetModule { }
