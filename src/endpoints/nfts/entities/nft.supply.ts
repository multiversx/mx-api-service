import { ApiProperty } from '@nestjs/swagger';
export class NftSupply {
    @ApiProperty({ type: String, default: 0 })
    supply: string = '0';
}
