import { Field, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given detailed account for." })
export class GetAccountDetailedInput {
  @Field(() => String, { name: "address", description: "Address to retrieve the corresponding detailed account for." })
  address: string = "";

  public static resolve(input: GetAccountDetailedInput): string {
    return input.address;
  }
}
