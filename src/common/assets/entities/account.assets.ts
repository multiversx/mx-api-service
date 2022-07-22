import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("AccountAssets", { description: "Account assets object type." })
export class AccountAssets {
  @Field(() => String, { description: "Name for the given account asset." })
  name: string = '';

  @Field(() => String, { description: "Description for the given account asset." })
  description: string = '';

  @Field(() => [String], { description: "Tags list for the given account asset." })
  tags: string[] = [];

  @Field(() => String, { description: "Proof for the given account asset.", nullable: true })
  proof: string | undefined = undefined;

  @Field(() => String, { description: "Icon for the given account asset.", nullable: true })
  icon: string | undefined = undefined;

  @Field(() => String, { description: "Icon PNG for the given account asset.", nullable: true })
  iconPng: string | undefined = undefined;

  @Field(() => String, { description: "Icon SVG for the given account asset.", nullable: true })
  iconSvg: string | undefined = undefined;
}
