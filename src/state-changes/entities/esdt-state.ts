import { ESDTType } from "./esdt-type";

export class EsdtState {
  identifier!: string;
  nonce!: string;
  type!: ESDTType;
  value!: string;
  propertiesHex!: string;
  reservedHex!: string;
  tokenMetaData!: any;

  constructor(init?: Partial<EsdtState>) {
    Object.assign(this, init);
  }
}
