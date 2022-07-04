import { EsdtLockedAccount } from "src/endpoints/esdt/entities/esdt.locked.account";

export class TokenSupplyResult {
  constructor(init?: Partial<TokenSupplyResult>) {
    Object.assign(this, init);
  }

  supply: string | number = '';
  circulatingSupply: string | number = '';
  minted: string | number | undefined;
  burnt: string | number | undefined;
  initialMinted: string | number | undefined;
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
