import { Field, Float, InputType } from "@nestjs/graphql";
import { QueryPagination } from "src/common/entities/query.pagination";

@InputType({ description: "Input to retrieve the given waiting-list for." })
export class GetWaitingListInput {
  constructor(partial?: Partial<GetWaitingListInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of waiting-list to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of waiting-list to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetWaitingListInput): QueryPagination {
    return { from: input.from, size: input.size };
  }
}
