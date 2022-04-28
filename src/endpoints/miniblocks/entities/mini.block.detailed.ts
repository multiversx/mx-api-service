import { ApiProperty } from "@nestjs/swagger";

export class MiniBlockDetailed {
    @ApiProperty({ type: String })
    miniBlockHash: string = '';

    @ApiProperty({ type: String })
    receiverBlockHash: string = '';

    @ApiProperty({ type: Number })
    receiverShard: number = 0;

    @ApiProperty({ type: String })
    senderBlockHash: string = '';

    @ApiProperty({ type: Number })
    senderShard: number = 0;

    @ApiProperty({ type: Number })
    timestamp: number = 0;

    @ApiProperty({ type: String })
    type: string = '';
}
