import { ApiProperty } from "@nestjs/swagger";

export class Token {
    @ApiProperty()
    token: string = '';

    @ApiProperty()
    name: string = '';

    @ApiProperty()
    owner: string = '';

    @ApiProperty()
    minted: string = '';

    @ApiProperty()
    burnt: string = '';

    @ApiProperty()
    decimals: number = 0;

    @ApiProperty()
    isPaused: boolean = false;
}