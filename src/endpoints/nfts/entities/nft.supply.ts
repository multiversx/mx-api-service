import { ApiProperty } from '@nestjs/swagger';
export class NftSupply {
    @ApiProperty({ type: String, default: '1' })
    supply: string = '0';
}
