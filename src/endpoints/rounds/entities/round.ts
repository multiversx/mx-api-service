import { ApiProperty } from "@nestjs/swagger";

export class Round {
    @ApiProperty()
    blockWasProposed: boolean = false;

    @ApiProperty()
    round: number = 0;

    @ApiProperty()
    shard: number = 0;

    @ApiProperty()
    epoch: number = 0;
    
    @ApiProperty()
    timestamp: number = 0;
}