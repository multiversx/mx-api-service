import { ApiProperty } from "@nestjs/swagger";
import { EsdtLockedAccount } from "src/endpoints/esdt/entities/esdt.locked.account";

export class TokenSupplyResult {
  constructor(init?: Partial<TokenSupplyResult>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Supply details', type: String })
  supply: string | number = '';

  @ApiProperty({ description: 'Circulating supply details', type: String })
  circulatingSupply: string | number = '';

  @ApiProperty({ description: 'Minted details', type: String })
  minted: string | number | undefined;

  @ApiProperty({ description: 'Token burnt details', type: String })
  burnt: string | number | undefined;

  @ApiProperty({ description: 'Initial minted details', type: String })
  initialMinted: string | number | undefined;

  @ApiProperty({ description: 'Esdt locked accounts details', type: EsdtLockedAccount, isArray: true })
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
