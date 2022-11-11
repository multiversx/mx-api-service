import { Field, ID, InputType } from "@nestjs/graphql";


@InputType({ description: "Input to retrieve the given  block for." })
export class GetMiniBlockHashInput {
  constructor(partial?: Partial<GetMiniBlockHashInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "miniBlockHash", description: "Specific mini block hash to retrieve the corresponding block for." })
  miniBlockHash: string = "";

  public static resolve(input: GetMiniBlockHashInput): string {
    return input.miniBlockHash;
  }
}
