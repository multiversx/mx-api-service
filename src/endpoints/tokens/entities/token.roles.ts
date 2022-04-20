import { ApiProperty } from '@nestjs/swagger';
export class TokenRoles {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  canMint: boolean = false;

  @ApiProperty()
  canBurn: boolean = false;

  @ApiProperty()
  roles: string[] = [];
}
