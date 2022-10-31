import { Field, Float, InputType } from "@nestjs/graphql";
import { QueryPagination } from "src/common/entities/query.pagination";

@InputType({ description: "Input to retrieve the given mex farms for." })
export class GetMexFarmsInput {
  constructor(partial?: Partial<GetMexFarmsInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of mex farms to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of mex farms to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  public static resolve(input: GetMexFarmsInput): QueryPagination {
    return { from: input.from, size: input.size };
  }
}

