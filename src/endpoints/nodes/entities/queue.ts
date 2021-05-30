import { ApiProperty } from "@nestjs/swagger";

export class Queue {
    @ApiProperty()
    bls: string = '';

    @ApiProperty()
    nonce: number = 0;

    @ApiProperty()
    rewards: number = 0;

    @ApiProperty()
    position: number = 0;
}