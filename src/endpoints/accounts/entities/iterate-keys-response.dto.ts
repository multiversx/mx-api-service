import { ApiProperty } from '@nestjs/swagger';

export class BlockInfoDto {
  @ApiProperty({ description: 'Block hash' })
  hash: string = '';

  @ApiProperty({ description: 'Block nonce' })
  nonce: number = 0;

  @ApiProperty({ description: 'Block root hash' })
  rootHash: string = '';
}

export class IterateKeysResponseDto {
  @ApiProperty({
    description: 'Block information for consistency guarantees',
    type: BlockInfoDto,
    required: false,
  })
  blockInfo?: BlockInfoDto;

  @ApiProperty({
    description: 'Iterator state for the next request. Empty array indicates no more keys available.',
    type: [String],
  })
  newIteratorState: string[] = [];

  @ApiProperty({
    description: 'Key-value pairs from the account storage. Keys and values are hex-encoded.',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  pairs: { [key: string]: string } = {};
} 
