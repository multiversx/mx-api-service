import { Field, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given provider for." })
export class GetProviderInput {
  constructor(partial?: Partial<GetProviderInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "identity", description: "Identity provider for the given result set.", nullable: true })
  identity: string = "";

  public static resolve(input: GetProviderInput) {
    return input.identity;
  }
}

@InputType({ description: "Input to retrieve the given provider for." })
export class GetProviderByAddressInput {
  constructor(partial?: Partial<GetProviderByAddressInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "address", description: "Identity provider for the given result set.", nullable: true })
  address: string = "";

  public static resolve(input: GetProviderByAddressInput) {
    return input.address;
  }
}
