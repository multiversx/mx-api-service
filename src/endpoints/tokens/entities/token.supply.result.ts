import { EsdtLockedAccount } from "src/endpoints/esdt/entities/esdt.locked.account";

export class TokenSupplyResult {
  supply: string | number = '';
  circulatingSupply: string | number = '';
  minted: string | number | undefined;
  burnt: string | number | undefined;
  initialMinted: string | number | undefined;
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
