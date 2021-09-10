import { ApiProperty } from '@nestjs/swagger';

export class NetworkConfig {
  @ApiProperty({ description: 'The number of rounds passed' })
  roundsPassed = 0;
  @ApiProperty({ description: 'The number of rounds per epoch' })
  roundsPerEpoch = 0;
  @ApiProperty({ description: 'The duration of a round' })
  roundDuration = 0;
}
