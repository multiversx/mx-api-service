import { ApiProperty } from '@nestjs/swagger';

export class MexEconomics {
    @ApiProperty({ type: Number, example: 8045920000000 })
    totalSupply: number = 0;

    @ApiProperty({ type: Number, example: 4913924072690 })
    circulatingSupply: number = 0;

    @ApiProperty({ type: Number, example: 0.00020552146843751037 })
    price: number = 0;

    @ApiProperty({ type: Number, example: 1009916891 })
    marketCap: number = 0;

    @ApiProperty({ type: Number, example: 13680479 })
    volume24h: number = 0;

    @ApiProperty({ type: Number, example: 15 })
    marketPairs: number = 0;
}
