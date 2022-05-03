import { EsdtLockedAccount } from "./esdt.locked.account";

export class EsdtSupply {
  totalSupply: string = '0';
  circulatingSupply: string = '0';
  minted: string = '0';
  burned: string = '0';
  initialMinted: string = '0';
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
