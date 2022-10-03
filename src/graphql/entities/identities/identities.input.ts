import { Field, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given identity for." })
export class GetIndentityInput {
  constructor(partial?: Partial<GetIndentityInput>) {
    Object.assign(this, partial);
  }

  @Field(() => [String], { name: "identities", description: "list of identities.", nullable: true })
  identities!: Array<string>;

  public static resolve(input: GetIndentityInput): string[] {
    return input.identities;
  }
}
