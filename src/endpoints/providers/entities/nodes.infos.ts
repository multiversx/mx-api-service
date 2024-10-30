import { ApiProperty } from "@nestjs/swagger";

export class NodesInfos {
  constructor(init?: Partial<NodesInfos>) {
    Object.assign(this, init);
  }

  @ApiProperty({ name: 'Number of nodes', type: Number, example: 10 })
  numNodes: number = 0;

  @ApiProperty({ name: 'Number of stake', type: Number, example: 100 })
  stake: string = '';

  @ApiProperty({ name: 'Number of topUp', type: Number, example: 100 })
  topUp: string = '';

  @ApiProperty({ name: 'Locked number', type: Number, example: 100 })
  locked: string = '';
}
