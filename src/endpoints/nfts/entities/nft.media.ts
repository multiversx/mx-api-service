import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("NftMedia", { description: "NFT media object type." })
export class NftMedia {
  constructor(init?: Partial<NftMedia>) {
    Object.assign(this, init);
  }
  
  @Field(() => String, { description: "URL for the given NFT media." })
  @ApiProperty()
  url: string = '';

  @Field(() => String, { description: "Original URL for the given NFT media." })
  @ApiProperty()
  originalUrl: string = '';

  @Field(() => String, { description: "Thumbnail URL for the given NFT media." })
  @ApiProperty()
  thumbnailUrl: string = '';

  @Field(() => String, { description: "File type for the given NFT media." })
  @ApiProperty()
  fileType: string = '';

  @Field(() => Float, { description: "File size for the given NFT media." })
  @ApiProperty()
  fileSize: number = 0;
}
