import { ApiProperty } from '@nestjs/swagger';

export class IterateKeysRequestDto {
  @ApiProperty({
    description: 'Number of keys to retrieve. Set to 0 to retrieve keys until timeout is reached.',
    example: 10,
    minimum: 0,
  })
  numKeys: number = 0;

  @ApiProperty({
    description: 'Iterator state for pagination. Empty array for the first request, use returned newIteratorState for subsequent requests.',
    example: [],
    type: [String],
  })
  iteratorState: string[] = [];
} 
