import { ApiProperty } from "@nestjs/swagger";

export class EsdtSupply {
  totalSupply: string = '0';
  circulatingSupply: string = '0';
  minted: string = '0';
  burned: string = '0';
  initialMinted: string = '0';
}
