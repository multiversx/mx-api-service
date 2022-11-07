import { Field, Float, ID, InputType } from "@nestjs/graphql";
import { SortOrder } from "src/common/entities/sort.order";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenSort } from "src/endpoints/tokens/entities/token.sort";
import { GetAccountDetailedInput } from "../account.detailed/account.detailed.input";

@InputType({ description: "Input to retreive the given tokens count for." })
export class GetTokensCountInput {
  constructor(partial?: Partial<GetTokensCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "search", description: "Search filter for the given tokens set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => String, { name: "name", description: "Name filter for the given tokens set.", nullable: true })
  name: string | undefined = undefined;

  @Field(() => String, { name: "identifier", description: "Identifier filter for the given tokens set.", nullable: true })
  identifier: string | undefined = undefined;

  @Field(() => [String], { name: "identifiers", description: "Identifiers filter for the given tokens set.", nullable: true })
  identifiers: string[] | undefined = undefined;

  public static resolve(input: GetTokensCountInput): TokenFilter {
    return new TokenFilter({
      search: input.search,
      name: input.name,
      identifier: input.identifier,
      identifiers: input.identifiers,
    });
  }
}

@InputType({ description: "Input to retreive the given tokens count for." })
export class GetTokensInput extends GetTokensCountInput {
  constructor(partial?: Partial<GetTokensCountInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of tokens to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of tokens to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => TokenSort, { name: "sort", description: "Sort filter for the given tokens set.", nullable: true })
  sort: TokenSort | undefined = undefined;

  @Field(() => SortOrder, { name: "order", description: "Order filter for the given tokens set.", nullable: true })
  order: SortOrder | undefined = undefined;
}

@InputType({ description: "Input to retrieve the given token for." })
export class GetTokenInput {
  constructor(partial?: Partial<GetTokenInput>) {
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "identifier", description: "Identifier to retrieve the corresponding token for." })
  identifier: string = "";

  public static resolve(input: GetTokenInput): string {
    return input.identifier;
  }
}

@InputType({ description: "Input to retrieve the given token role address for." })
export class GetTokenRolesForIdentifierAndAddressInput extends GetTokenInput {
  constructor(partial?: Partial<GetTokenRolesForIdentifierAndAddressInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => ID, { name: "address", description: "Address to retrieve the corresponding token roles for." })
  address: string = "";
}

@InputType({ description: "Input to retrieve the given token accounts for." })
export class GetTokenAccountsInput extends GetTokenInput {
  constructor(partial?: Partial<GetTokenAccountsInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of tokens to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of tokens to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}

@InputType({ description: "Input to retrieve the given account details with roles for." })
export class GetAccountTokenRolesInput extends GetAccountDetailedInput {
  constructor(partial?: Partial<GetAccountTokenRolesInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of tokens to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of tokens to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;

  @Field(() => ID, { name: "identifier", description: "Tokens identifier to retrieve for the given result set.", nullable: true })
  identifier?: string;

  @Field(() => String, { name: "search", description: "Tokens search to retrieve for the given result set.", nullable: true })
  search?: string;

  @Field(() => String, { name: "creator", description: "Owner to retrieve for the given result set.", nullable: true })
  owner?: string;

  @Field(() => Boolean, { name: "canMint", description: "Filter by property canMint to retrieve the given result set.", nullable: true })
  canMint?: boolean;

  @Field(() => Boolean, { name: "canBurn", description: "Filter by property canBurn to retrieve the given result set.", nullable: true })
  canBurn?: boolean;
}
