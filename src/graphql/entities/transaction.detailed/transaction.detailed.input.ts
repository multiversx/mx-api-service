import { Field, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given detailed transaction for." })
export class GetTransactionDetailedInput {
  @Field(() => String, { name: "hash", description: "Hash to retrieve the corresponding detailed transaction for." })
  hash: string = "";

  public static resolve(input: GetTransactionDetailedInput): string {
    return input.hash;
  }
}
