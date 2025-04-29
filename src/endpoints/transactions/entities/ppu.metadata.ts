import { ApiProperty } from '@nestjs/swagger';

export class PpuMetadata {
    @ApiProperty({
        description: 'Last processed block number',
        example: 47428477,
    })
    lastBlock: number = 0;

    @ApiProperty({
        description: 'Price per unit for standard (medium priority) transactions',
        example: 20000000,
    })
    fast: number = 0;

    @ApiProperty({
        description: 'Price per unit for fast (high priority) transactions',
        example: 40000000,
    })
    faster: number = 0;

    constructor(init?: Partial<PpuMetadata>) {
        Object.assign(this, init);
    }
} 
