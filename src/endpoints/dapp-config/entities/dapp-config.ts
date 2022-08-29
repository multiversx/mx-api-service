import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("DappConfig", { description: "DappConfig object type." })
export class DappConfig {
  constructor(init?: Partial<DappConfig>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Network Details.' })
  @ApiProperty({ type: String, example: 'mainnet' })
  id: string = '';

  @Field(() => String, { description: 'Network name.' })
  @ApiProperty({ type: String, example: 'Mainnet' })
  name: string = '';

  @Field(() => String, { description: 'Token label details' })
  @ApiProperty({ type: String, example: 'eGLD' })
  egldLabel: string = '';

  @Field(() => String, { description: 'Token details' })
  @ApiProperty({ type: String, example: '4' })
  decimals: string = '';

  @Field(() => String, { description: 'Token denomination details' })
  @ApiProperty({ type: String, example: '18' })
  egldDenomination: string = '';

  @Field(() => String, { description: 'Gas data byte details' })
  @ApiProperty({ type: String, example: '1500' })
  gasPerDataByte: string = '';

  @Field(() => String, { description: 'Api Timeout details' })
  @ApiProperty({ type: String, example: '4000' })
  apiTimeout: string = '';

  @Field(() => String, { description: 'Wallet connect url details' })
  @ApiProperty({ type: String, example: 'https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=https://maiar.com/' })
  walletConnectDeepLink: string = '';

  @Field(() => [String], { description: 'Bridge wallet url details' })
  @ApiProperty({ type: [String], example: 'https://bridge.walletconnect.org' })
  walletConnectBridgeAddresses: string = '';

  @Field(() => String, { description: 'Wallet url details' })
  @ApiProperty({ type: String, example: 'https://wallet.elrond.com' })
  walletAddress: string = '';

  @Field(() => String, { description: 'Api url details' })
  @ApiProperty({ type: String, example: 'https://api.elrond.com' })
  apiAddress: string = '';

  @Field(() => String, { description: 'Explorer address details' })
  @ApiProperty({ type: String, example: 'https://explorer.elrond.com' })
  explorerAddress: string = '';

  @Field(() => String, { description: 'ChainID details' })
  @ApiProperty({ type: String, example: '1' })
  chainId: string = '';
}
