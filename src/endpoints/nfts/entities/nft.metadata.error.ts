import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { NftMetadataErrorCode } from "./nft.metadata.error.code";

@ObjectType("NftMetadataError", { description: "NFT Metadata error." })
export class NftMetadataError {
  @Field(() => NftMetadataErrorCode, { description: "Error code" })
  @ApiProperty({ enum: NftMetadataErrorCode })
  code: NftMetadataErrorCode = NftMetadataErrorCode.unknownError;

  @Field(() => String, { description: "Error message" })
  @ApiProperty()
  message: string = '';

  @Field(() => Number, { description: "Timestamp when the error was generated" })
  @ApiProperty()
  timestamp: number = 0;
}
