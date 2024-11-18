import { ApiProperty } from "@nestjs/swagger";
import { Round } from "./round";

export class RoundDetailed extends Round {
  constructor(init?: Partial<RoundDetailed>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Signers', type: String, isArray: true })
  signers: string[] = [];
}
