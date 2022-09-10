import { ApiProperty } from "@nestjs/swagger";

export class MexTokenFilter {
  constructor(init?: Partial<MexTokenFilter>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  id: string = "";
}
