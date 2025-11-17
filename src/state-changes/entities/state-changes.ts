import { AccountState } from "./account-state";
import { EsdtState } from "./esdt-state";
import { AccountChanges } from "./account-changes";

export class StateChanges {
  accountState!: AccountState | undefined;
  esdtState!: {
    'Fungible': EsdtState[],
    'NonFungible': EsdtState[],
    'NonFungibleV2': EsdtState[],
    'SemiFungible': EsdtState[],
    'MetaFungible': EsdtState[],
    'DynamicNFT': EsdtState[],
    'DynamicSFT': EsdtState[],
    'DynamicMeta': EsdtState[],
  };
  accountChanges!: AccountChanges;
  isNewAccount!: boolean;

  constructor(init?: Partial<StateChanges>) {
    Object.assign(this, init);
  }
}
