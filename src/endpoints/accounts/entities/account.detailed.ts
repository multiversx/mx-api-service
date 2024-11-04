import { ComplexityEstimation } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { Account } from "./account";

export class AccountDetailed extends Account {
  constructor(init?: Partial<AccountDetailed>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'The source code in hex format' })
  code: string = '';

  @ApiProperty({ description: 'The hash of the source code' })
  codeHash: string = '';

  @ApiProperty({ description: 'The hash of the root node' })
  rootHash: string = '';

  @ApiProperty({ description: 'The username specific for this account', nullable: true })
  username: string | undefined = undefined;

  @ApiProperty({ description: 'The developer reward' })
  developerReward: string = '';

  @ApiProperty({ description: 'The address in bech 32 format of owner account' })
  ownerAddress: string = '';

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean , required: false })
  isUpgradeable?: boolean;

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean , required: false })
  isReadable?: boolean;

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean , required: false })
  isPayable?: boolean;

  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean, nullable: true , required: false })
  isPayableBySmartContract?: boolean | undefined = undefined;

  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ description: 'Account nft collections', type: Boolean, nullable: true })
  nftCollections: NftCollectionAccount[] | undefined = undefined;

  @ApiProperty({ description: 'Account nfts', type: Boolean, nullable: true })
  @ComplexityEstimation({ group: 'nfts', value: 1000 })
  nfts: NftAccount[] | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true , required: false })
  activeGuardianActivationEpoch?: number;

  @ApiProperty({ type: String, nullable: true , required: false })
  activeGuardianAddress?: string;

  @ApiProperty({ type: String, nullable: true , required: false })
  activeGuardianServiceUid?: string;

  @ApiProperty({ type: Number, nullable: true , required: false })
  pendingGuardianActivationEpoch?: number;

  @ApiProperty({ type: String, nullable: true , required: false })
  pendingGuardianAddress?: string;

  @ApiProperty({ type: String, nullable: true , required: false })
  pendingGuardianServiceUid?: string;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  isGuarded?: boolean;
}
