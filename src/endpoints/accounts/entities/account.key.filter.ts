
import { Field, ObjectType } from "@nestjs/graphql";
import { NodeStatusRaw } from "src/endpoints/nodes/entities/node.status";

@ObjectType("AccountKeyFilter", { description: "Account key filter object type." })
export class AccountKeyFilter {
  constructor(init?: Partial<AccountKeyFilter>) {
    Object.assign(this, init);
  }

  @Field(() => AccountKeyFilter, { description: "Account key status filter for the given keys.", nullable: true })
  status: NodeStatusRaw[] = [];
}
