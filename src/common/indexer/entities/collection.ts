export interface CollectionProperties {
  canMint?: boolean;
  canBurn?: boolean;
  canUpgrade?: boolean;
  canTransferNFTCreateRole?: boolean;
  canAddSpecialRoles?: boolean;
  canPause?: boolean;
  canFreeze?: boolean;
  canWipe?: boolean;
  canChangeOwner?: boolean;
  canCreateMultiShard?: boolean;
}

export interface Collection {
  _id: string;
  name: string;
  ticker: string;
  token: string;
  issuer: string;
  currentOwner: string;
  numDecimals?: number;
  type: string;
  timestamp: number;
  ownersHistory: { address: string, timestamp: number }[];
  properties?: CollectionProperties;
  api_isVerified?: boolean;
  api_nftCount?: number;
  api_holderCount?: number;
  nft_scamInfoType?: string;
  nft_scamInfoDescription?: string;
}
