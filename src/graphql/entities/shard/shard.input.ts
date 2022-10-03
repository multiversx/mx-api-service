import { Field, Float, InputType } from "@nestjs/graphql";
import { QueryPagination } from "src/common/entities/query.pagination";

@InputType({ description: "Input to retrieve the given tags for." })
export class GetShardInput {
  constructor(partial?: Partial<GetShardInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of shards to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of shards to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetShardInput): QueryPagination {
    return { from: input.from, size: input.size };
  }
}
