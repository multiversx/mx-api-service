import { ApiProperty } from "@nestjs/swagger";

export class CollectionRoles {
  constructor(init?: Partial<CollectionRoles>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true })
  address: string | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  canCreate: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canAddQuantity: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canUpdateAttributes: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canAddUri: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canTransfer: boolean | undefined = undefined;

  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
