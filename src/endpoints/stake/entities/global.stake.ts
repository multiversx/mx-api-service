import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class GlobalStake {
  constructor(init?: Partial<GlobalStake>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number, default: 3200 })
  totalValidators: number = 0;

  @ApiProperty({ type: Number, default: 3199 })
  activeValidators: number = 0;

  @ApiProperty({ type: Number, default: 3199 })
  totalObservers: number = 0;

  @ApiProperty({ type: Number, default: 2 })
  queueSize: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: string = '';

  @ApiProperty({ type: String, nullable: true })
  minimumAuctionQualifiedTopUp: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  minimumAuctionQualifiedStake: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  auctionValidators: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  nakamotoCoefficient: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  dangerZoneValidators: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  eligibleValidators: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  waitingValidators: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  qualifiedAuctionValidators: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  allStakedNodes: number | undefined = undefined;
}
