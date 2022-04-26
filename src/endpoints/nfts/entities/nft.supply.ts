import { ApiProperty } from '@nestjs/swagger';
export class NftSupply {
    @ApiProperty()
    supply: string = '0';
}
