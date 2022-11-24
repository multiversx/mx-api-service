export class TokenWithRolesFilter {
  constructor(init?: Partial<TokenWithRolesFilter>) {
    Object.assign(this, init);
  }

  identifier?: string;

  search?: string;

  owner?: string;

  canMint?: boolean;

  canBurn?: boolean;

  includeMetaESDT?: boolean;
}
