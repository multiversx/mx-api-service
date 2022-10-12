import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("EsdtLockedAccount", { description: "EsdtLockedAccount object type." })
export class EsdtLockedAccount {
  constructor(init?: Partial<EsdtLockedAccount>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Locked account address." })
  @ApiProperty()
  address: string = '';

  @Field(() => String, { description: "Locked account name.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  name: string | undefined = undefined;

  @Field(() => String, { description: "Locked account balance." })
  @ApiProperty({ type: String })
  balance: string | number = '';
}
