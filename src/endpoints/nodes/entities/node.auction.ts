import { ApiProperty } from "@nestjs/swagger";

export class NodeAuction {
  constructor(init?: Partial<NodeAuction>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identity?: string = '';

  @ApiProperty({ type: String })
  name?: string = '';

  @ApiProperty({ type: String, default: 0, required: false })
  description: string = '';

  @ApiProperty({ type: String, required: false })
  avatar: string = '';

  @ApiProperty({ type: String, required: false })
  provider?: string = '';

  @ApiProperty({ type: String })
  bls?: string = '';

  @ApiProperty({ type: String })
  stake: string = '';

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ required: false })
  distribution?: { [index: string]: number | undefined } = {};

  @ApiProperty({ type: String })
  auctionTopUp: string = '';

  @ApiProperty({ type: String })
  qualifiedStake: string = '';

  @ApiProperty({ type: Number })
  auctionValidators: number = 0;

  @ApiProperty({ type: Number })
  qualifiedAuctionValidators: number = 0;

  @ApiProperty({ type: Number })
  droppedValidators: number = 0;

  @ApiProperty({ type: Number })
  dangerZoneValidators: number = 0;
}
