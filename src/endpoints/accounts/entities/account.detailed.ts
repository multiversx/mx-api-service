import { ApiProperty } from "@nestjs/swagger";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Account } from "./account";

export class AccountDetailed extends Account {
    @ApiProperty({ description: 'The source code in hex format' })
    code: string = '';

    @ApiProperty({ description: 'The hash of the source code' })
    codeHash: string = '';

    @ApiProperty({ description: 'The hash of the root node' })
    rootHash: string = '';

    @ApiProperty({ description: 'The number of transactions performed on this account' })
    txCount: number = 0;

    @ApiProperty({ description: 'The number of smart contract results of this account' })
    scrCount: number = 0;

    @ApiProperty({ description: 'The username specific for this account' })
    username: string = '';

    @ApiProperty({ description: 'The developer reward' })
    developerReward: string = '';

    @ApiProperty({ description: 'The address in bech 32 format of owner account' })
    ownerAddress: string = '';

    @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
    deployedAt?: number;

    @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
    isUpgradeable?: boolean;

    @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
    isReadable?: boolean;

    @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
    isPayable?: boolean;

    @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
    isPayableBySmartContract?: boolean | undefined = undefined;

    @ApiProperty({ type: ScamInfo, nullable: true })
    scamInfo: ScamInfo | undefined = undefined;
}
