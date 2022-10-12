import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("MiniBlocks", { description: "MiniBlocks object type." })
export class MiniBlockDetailed {
  constructor(init?: Partial<MiniBlockDetailed>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "MiniBlock Hash details." })
  @ApiProperty({ type: String, example: 'c956ecbefbba25f0bcb0b182357d41287384fb8707d5860ad5cacc66f3fe0bc8' })
  miniBlockHash: string = '';

  @Field(() => String, { description: "Receiver Block Hash details." })
  @ApiProperty({ type: String, example: '3d008f54446e7f3c636159e0f4934267e154541a95665477676ea7f3abbc0aa7' })
  receiverBlockHash: string = '';

  @Field(() => Float, { description: "Receiver Shard details." })
  @ApiProperty({ type: Number, example: 0 })
  receiverShard: number = 0;

  @Field(() => String, { description: "Sender Block Hash details." })
  @ApiProperty({ type: String, example: '3d008f54446e7f3c636159e0f4934267e154541a95665477676ea7f3abbc0aa7' })
  senderBlockHash: string = '';

  @Field(() => Float, { description: "Sender shard details." })
  @ApiProperty({ type: Number, example: 0 })
  senderShard: number = 0;

  @Field(() => Float, { description: "Timestamp details." })
  @ApiProperty({ type: Number, example: 1646579514 })
  timestamp: number = 0;

  @Field(() => String, { description: "Transaction type details." })
  @ApiProperty({ type: String, example: 'TxBlock' })
  type: string = '';
}
