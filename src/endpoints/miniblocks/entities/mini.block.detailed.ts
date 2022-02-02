import { ApiProperty } from "@nestjs/swagger";

export class MiniBlockDetailed {
    @ApiProperty()
    miniBlockHash: string = '';

    @ApiProperty()
    receiverBlockHash: string = '';

    @ApiProperty()
    receiverShard: number = 0;

    @ApiProperty()
    senderBlockHash: string = '';

    @ApiProperty()
    senderShard: number = 0;

    @ApiProperty()
    timestamp: number = 0;

    @ApiProperty()
    type: string = '';
}
