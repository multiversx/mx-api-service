import { ApiProperty } from "@nestjs/swagger";

export class Token {
    @ApiProperty()
    token: string = '';

    @ApiProperty()
    name: string = '';

    @ApiProperty()
    owner: string = '';

    @ApiProperty()
    mintedValue: string = '';

    @ApiProperty()
    burntValue: string = '';

    @ApiProperty()
    isPaused: boolean = false;

    @ApiProperty()
    canUpgrade: boolean = false;

    @ApiProperty()
    canMint: boolean = false;

    @ApiProperty()
    canBurn: boolean = false;

    @ApiProperty()
    canChangeOwner: boolean = false;

    @ApiProperty()
    canPause: boolean = false;

    @ApiProperty()
    canFreeze: boolean = false;
    
    @ApiProperty()
    canWipe: boolean = false;
}