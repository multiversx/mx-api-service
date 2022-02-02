import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "./token.assets";

export class Token {
    @ApiProperty()
    identifier: string = '';

    @ApiProperty()
    name: string = '';

    @ApiProperty()
    ticker: string = '';

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

    @ApiProperty()
    assets: TokenAssets | undefined = undefined;

    @ApiProperty()
    transactions: number | undefined = undefined;

    @ApiProperty()
    accounts: number | undefined = undefined;
}
