import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("NftMetadata", { description: "NFT metadata object type." })
export class NftMetadata {
  constructor(init?: Partial<NftMetadata>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Description for the given NFT metadata." })
  @ApiProperty()
  description: string = '';

  @Field(() => String, { description: "File type for the given NFT metadata." })
  @ApiProperty()
  fileType: string = '';

  @Field(() => String, { description: "File URI for the given NFT metadata." })
  @ApiProperty()
  fileUri: string = '';

  @Field(() => String, { description: "File name for the given NFT metadata." })
  @ApiProperty()
  fileName: string = '';
}
