import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("AccountAssets", { description: "Account assets object type." })
export class AccountAssets {
  @Field(() => String, { description: "Name for the given account asset." })
  name: string = '';

  @Field(() => String, { description: "Description for the given account asset." })
  description: string = '';

  @Field(() => [String], { description: "Tags list for the given account asset." })
  tags: string[] = [];

  @Field(() => String, { description: "Proof for the given account asset." })
  proof: string | undefined = undefined;

  @Field(() => String, { description: "Icon for the given account asset." })
  icon: string | undefined = undefined;

  @Field(() => String, { description: "Icon PNG link for the given account asset." })
  iconPng: string | undefined = undefined;

  @Field(() => String, { description: "Icon SVG link for the given account asset." })
  iconSvg: string | undefined = undefined;
}
