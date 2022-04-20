import { ApiProperty } from "@nestjs/swagger";

export class CollectionRoles {

  @ApiProperty({ type: Boolean })
  address: string | undefined = undefined;

  @ApiProperty({ type: Boolean })
  canCreate: boolean = false;

  @ApiProperty({ type: Boolean })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean })
  canAddQuantity: boolean = false;

  @ApiProperty({ type: Boolean })
  canUpdateAttributes: boolean = false;

  @ApiProperty({ type: Boolean })
  canAddUri: boolean = false;

  @ApiProperty({ type: Boolean })
  canTransferRole: boolean = false;

  @ApiProperty()
  roles: string[] = [];
}
