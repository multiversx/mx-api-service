import { ApiProperty } from "@nestjs/swagger";
export class DappConfig {
  @ApiProperty({ type: String, example: 'mainnet' })
  id: string = '';

  @ApiProperty({ type: String, example: 'Mainnet' })
  name: string = '';

  @ApiProperty({ type: String, example: 'eGLD' })
  egldLabel: string = '';

  @ApiProperty({ type: String, example: '4' })
  decimals: string = '';

  @ApiProperty({ type: String, example: '18' })
  egldDenomination: string = '';

  @ApiProperty({ type: String, example: '1500' })
  gasPerDataByte: string = '';

  @ApiProperty({ type: String, example: '4000' })
  apiTimeout: string = '';

  @ApiProperty({ type: String, example: 'https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=https://maiar.com/' })
  walletConnectDeepLink: string = '';

  @ApiProperty({ type: [String], example: 'https://bridge.walletconnect.org' })
  walletConnectBridgeAddresses: string = '';

  @ApiProperty({ type: String, example: 'https://wallet.elrond.com' })
  walletAddress: string = '';

  @ApiProperty({ type: String, example: 'https://api.elrond.com' })
  apiAddress: string = '';

  @ApiProperty({ type: String, example: 'https://explorer.elrond.com' })
  explorerAddress: string = '';

  @ApiProperty({ type: String, example: '1' })
  chainId: string = '';
}
