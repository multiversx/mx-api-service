import { ApiProperty } from "@nestjs/swagger";
export class DappConfig {
    @ApiProperty()
    id: string = '';

    @ApiProperty()
    name: string = '';

    @ApiProperty()
    egldLabel: string = '';

    @ApiProperty()
    decimals: string = '';

    @ApiProperty()
    egldDenomination: string = '';

    @ApiProperty()
    gasPerDataByte: string = '';

    @ApiProperty()
    apiTimeout: string = '';

    @ApiProperty()
    walletConnectDeepLink: string = '';

    @ApiProperty()
    walletConnectBridgeAddresses: string = '';

    @ApiProperty()
    walletAddress: string = '';

    @ApiProperty()
    apiAddress: string = '';

    @ApiProperty()
    explorerAddress: string = '';

    @ApiProperty()
    chainId: string = '';
}
