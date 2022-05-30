import { ApiProperty } from "@nestjs/swagger";

export class MiniBlockDetailed {
    @ApiProperty({ type: String, example: 'c956ecbefbba25f0bcb0b182357d41287384fb8707d5860ad5cacc66f3fe0bc8' })
    miniBlockHash: string = '';

    @ApiProperty({ type: String, example: '3d008f54446e7f3c636159e0f4934267e154541a95665477676ea7f3abbc0aa7' })
    receiverBlockHash: string = '';

    @ApiProperty({ type: Number, example: 0 })
    receiverShard: number = 0;

    @ApiProperty({ type: String, example: '3d008f54446e7f3c636159e0f4934267e154541a95665477676ea7f3abbc0aa7' })
    senderBlockHash: string = '';

    @ApiProperty({ type: Number, example: 0 })
    senderShard: number = 0;

    @ApiProperty({ type: Number, example: 1646579514 })
    timestamp: number = 0;

    @ApiProperty({ type: String, example: 'TxBlock' })
    type: string = '';
}
