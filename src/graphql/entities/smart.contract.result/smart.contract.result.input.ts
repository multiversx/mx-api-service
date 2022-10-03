import { Field, Float, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given smart contract results for." })
export class GetSmartContractResultInput {
  constructor(partial?: Partial<GetSmartContractResultInput>) {
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of blocks to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of blocks to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => String, { name: "miniBlockHash", description: "Miniblockhash txHash for the given result set.", nullable: true })
  miniBlockHash: string | undefined;

  @Field(() => [String], { name: "originalTxHashes", description: "Original TxHashes for the given result set.", nullable: true })
  originalTxHashes: string[] | undefined;
}

@InputType({ description: "Input to retrieve the given smart contract hash for." })
export class GetSmartContractHashInput {
  constructor(partial?: Partial<GetSmartContractHashInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "scHash", description: "scHash for the given smart contract set." })
  scHash!: string;

  public static resolve(input: GetSmartContractHashInput) {
    return input.scHash;
  }
}
