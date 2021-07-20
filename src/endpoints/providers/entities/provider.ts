import { ApiProperty } from "@nestjs/swagger";

export class Provider {
  @ApiProperty()
  provider: string = '';

  @ApiProperty()
  owner: string | null = null;

  @ApiProperty()
  featured: boolean = false;

  @ApiProperty()
  serviceFee: number = 0  ;

  @ApiProperty()
  delegationCap: string = '';

  @ApiProperty()
  apr: number = 0;

  @ApiProperty()
  numUsers: number = 0;

  @ApiProperty()
  numNodes: number = 0;

  @ApiProperty()
  cumulatedRewards: string | null = null;

  @ApiProperty()
  identity: string | undefined;

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  topUp: string = '';

  @ApiProperty()
  locked: string = '';
}