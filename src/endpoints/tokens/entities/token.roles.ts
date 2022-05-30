import { ApiProperty } from '@nestjs/swagger';
export class TokenRoles {
  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
