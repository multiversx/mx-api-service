import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("CollectionRoles", { description: "Collection roles object type." })
export class CollectionRoles {
  constructor(init?: Partial<CollectionRoles>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given collection roles.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  address: string | undefined = undefined;

  @Field(() => Boolean, { description: 'Can create for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canCreate: boolean = false;

  @Field(() => Boolean, { description: 'Can burn for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @Field(() => Boolean, { description: 'Can add quantity for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canAddQuantity: boolean = false;

  @Field(() => Boolean, { description: 'Can update attributes for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canUpdateAttributes: boolean = false;

  @Field(() => Boolean, { description: 'Can add URI for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canAddUri: boolean = false;

  @Field(() => Boolean, { description: 'Can transfer role for the given collection roles.' })
  @ApiProperty({ type: Boolean, default: false })
  canTransferRole: boolean = false;

  @Field(() => [String], { description: 'Roles for the given collection roles.' })
  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
