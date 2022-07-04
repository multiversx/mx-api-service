import { ApiProperty } from "@nestjs/swagger";

export class NodesInfos {
  constructor(init?: Partial<NodesInfos>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  numNodes: number = 0;

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  topUp: string = '';

  @ApiProperty()
  locked: string = '';
}
