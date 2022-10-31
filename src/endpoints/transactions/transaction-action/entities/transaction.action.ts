import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

import GraphQLJSON from "graphql-type-json";

@ObjectType("TransactionAction", { description: "Transaction action object type." })
export class TransactionAction {
  constructor(init?: Partial<TransactionAction>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Category for the given transaction action." })
  @ApiProperty({ type: String })
  category: string = '';

  @Field(() => String, { description: "Name for the given transaction action." })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => String, { description: "Description for the given transaction action." })
  @ApiProperty({ type: String })
  description: string = '';

  @Field(() => GraphQLJSON, { description: "Description for the given transaction action.", nullable: true })
  @ApiProperty()
  arguments?: { [key: string]: any };
}
