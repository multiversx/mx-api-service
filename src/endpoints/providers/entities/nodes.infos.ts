import { ApiProperty } from "@nestjs/swagger";

export class NodesInfos {
  @ApiProperty()
  numNodes: number = 0;

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  topUp: string = '';

  @ApiProperty()
  locked: string = '';
}
