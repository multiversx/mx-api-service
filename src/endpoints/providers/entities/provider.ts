import { ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Providers } from "./providers";

@ObjectType("Provider", { description: "Provider object type." })
export class Provider extends Providers {
  constructor(init?: Partial<Provider>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  initialOwnerFunds?: string = "";

  @ApiProperty({ type: Boolean, default: false })
  automaticActivation?: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  checkCapOnRedelegate?: boolean = false;

  @ApiProperty({ type: String })
  totalUnStaked?: string = "";

  @ApiProperty({ type: Number })
  createdNonce?: number = 0;
}
