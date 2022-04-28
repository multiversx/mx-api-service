import { ApiProperty } from "@nestjs/swagger";
export class DappConfig {
    @ApiProperty({ type: String })
    id: string = '';

    @ApiProperty({ type: String })
    name: string = '';

    @ApiProperty({ type: String })
    egldLabel: string = '';

    @ApiProperty({ type: String })
    decimals: string = '';

    @ApiProperty({ type: String })
    egldDenomination: string = '';

    @ApiProperty({ type: String })
    gasPerDataByte: string = '';

    @ApiProperty({ type: String })
    apiTimeout: string = '';

    @ApiProperty({ type: String })
    walletConnectDeepLink: string = '';

    @ApiProperty({ type: String })
    walletConnectBridgeAddresses: string = '';

    @ApiProperty({ type: String })
    walletAddress: string = '';

    @ApiProperty({ type: String })
    apiAddress: string = '';

    @ApiProperty({ type: String })
    explorerAddress: string = '';

    @ApiProperty({ type: String })
    chainId: string = '';
}
