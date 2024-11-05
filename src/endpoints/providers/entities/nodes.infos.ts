import { ApiProperty } from "@nestjs/swagger";

export class NodesInfos {
  constructor(init?: Partial<NodesInfos>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Number of nodes', type: Number, example: 10 })
  numNodes: number = 0;

  @ApiProperty({ description: 'Number of stake', type: Number, example: 100 })
  stake: string = '';

  @ApiProperty({ description: 'Number of topUp', type: Number, example: 100 })
  topUp: string = '';

  @ApiProperty({ description: 'Locked number', type: Number, example: 100 })
  locked: string = '';
}
