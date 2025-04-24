import { ApiProperty } from "@nestjs/swagger";

export class DappConfig {
  constructor(init?: Partial<DappConfig>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'mainnet' })
  id: string = '';

  @ApiProperty({ type: String, example: 'Mainnet' })
  name: string = '';

  @ApiProperty({ type: String, example: 'EGLD' })
  egldLabel: string = '';

  @ApiProperty({ type: String, example: '4' })
  decimals: string = '';

  @ApiProperty({ type: String, example: '18' })
  egldDenomination: string = '';

  @ApiProperty({ type: String, example: '1500' })
  gasPerDataByte: string = '';

  @ApiProperty({ type: String, example: '4000' })
  apiTimeout: string = '';

  @ApiProperty({ type: String, example: 'https://maiar.page.link/?apn=com.multiversx.maiar.wallet&isi=1519405832&ibi=com.multiversx.maiar.wallet&link=https://maiar.com/' })
  walletConnectDeepLink: string = '';

  @ApiProperty({ type: [String], example: 'https://bridge.walletconnect.org' })
  walletConnectBridgeAddresses: string = '';

  @ApiProperty({ type: String, example: 'https://wallet.multiversx.com' })
  walletAddress: string = '';

  @ApiProperty({ type: String, example: 'https://api.multiversx.com' })
  apiAddress: string = '';

  @ApiProperty({ type: String, example: 'https://explorer.multiversx.com' })
  explorerAddress: string = '';

  @ApiProperty({ type: String, example: '1' })
  chainId: string = '';

  @ApiProperty({ type: Number, example: 6000 })
  refreshRate: number = 0;
}
