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

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canCreate?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canBurn?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canAddQuantity?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canUpdateAttributes?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canAddUri?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canTransfer?: boolean = undefined;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
