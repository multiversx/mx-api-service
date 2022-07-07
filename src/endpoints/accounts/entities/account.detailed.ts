import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Account } from "./account";

@ObjectType("AccountDetailed", { description: "Detailed Account object type that extends Account." })
export class AccountDetailed extends Account {
  constructor(init?: Partial<AccountDetailed>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Source code in HEX format for the given detailed account.' })
  @ApiProperty({ description: 'The source code in hex format' })
  code: string = '';

  @Field(() => String, { description: 'Hash of the source code for the given detailed account.' })
  @ApiProperty({ description: 'The hash of the source code' })
  codeHash: string = '';

  @Field(() => String, { description: 'Hash of the root node for the given detailed account.' })
  @ApiProperty({ description: 'The hash of the root node' })
  rootHash: string = '';

  @Field(() => Int, { description: 'Number of transactions performed for the given detailed account.' })
  @ApiProperty({ description: 'The number of transactions performed on this account' })
  txCount: number = 0;

  @Field(() => Int, { description: 'Number of smart contract results for the given detailed account.' })
  @ApiProperty({ description: 'The number of smart contract results of this account' })
  scrCount: number = 0;

  @Field(() => String, { description: 'Username for the given detailed account.' })
  @ApiProperty({ description: 'The username specific for this account' })
  username: string = '';

  @Field(() => String, { description: 'Developer reward for the given detailed account.' })
  @ApiProperty({ description: 'The developer reward' })
  developerReward: string = '';

  @Field(() => String, { description: 'Bech32 address of the owner account for the given detailed account.' })
  @ApiProperty({ description: 'The address in bech 32 format of owner account' })
  ownerAddress: string = '';

  @Field(() => Int, { nullable: true, description: 'Deployment timestamp for the given detailed account.' })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Number })
  deployedAt?: number;

  @Field(() => Boolean, { nullable: true, description: 'If the given detailed account is upgradeable.' })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
  isUpgradeable?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'If the given detailed account is readable.' })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
  isReadable?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'If the given detailed account is payable.' })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
  isPayable?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'If the given detailed account is payable by smart contract.' })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean, nullable: true })
  isPayableBySmartContract?: boolean | undefined = undefined;

  @Field(() => ScamInfo, { description: 'Scam information for the given detailed account.', nullable: true })
  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;
}
