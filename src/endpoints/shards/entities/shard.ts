import { ApiProperty } from "@nestjs/swagger";

export class Shard {
    @ApiProperty()
    shard: number = 0;

    @ApiProperty()
    validators: number = 0;

    @ApiProperty()
    activeValidators: number = 0;
}