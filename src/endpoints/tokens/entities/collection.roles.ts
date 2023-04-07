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

  @Field(() => Boolean, { description: 'If the given collection role can create.' })
  @ApiProperty({ type: Boolean, default: false })
  canCreate: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can burn.' })
  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can add quantity.' })
  @ApiProperty({ type: Boolean, default: false })
  canAddQuantity: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can update attributes.' })
  @ApiProperty({ type: Boolean, default: false })
  canUpdateAttributes: boolean = false;

  @Field(() => Boolean, { description: 'If the given collection role can add URI.' })
  @ApiProperty({ type: Boolean, default: false })
  canAddUri: boolean = false;

  @Field(() => Boolean, { description: 'If tokens from the given collections are allowed to be transferred by the given account.' })
  @ApiProperty({ type: Boolean, default: false })
  canTransfer: boolean | undefined = undefined;

  @Field(() => [String], { description: 'Roles list for the given collection roles.' })
  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
