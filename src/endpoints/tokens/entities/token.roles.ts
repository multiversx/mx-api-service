import { ApiProperty } from '@nestjs/swagger';

export class TokenRoles {
  constructor(init?: Partial<TokenRoles>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true })
  address: string | undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canLocalBurn: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canCreate?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canBurn?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canAddQuantity?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canUpdateAttributes?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canAddUri?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer?: boolean = undefined;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
