import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

@ObjectType("DeployedContract", { description: "Deployed contract object type." })
export class DeployedContract {
  constructor(init?: Partial<DeployedContract>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given account.' })
  @ApiProperty({ type: String })
  address: string = "";

  @Field(() => String, { description: 'DeployTxHash for the given account.' })
  @ApiProperty({ type: String })
  deployTxHash: string = "";

  @Field(() => Float, { description: 'Timestamp for the given account.' })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => AccountAssets, { description: 'Assets for the given account.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Contract assets' })
  assets: AccountAssets | undefined = undefined;
}
