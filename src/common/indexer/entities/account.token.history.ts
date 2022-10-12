export interface AccountTokenHistory {
  address: string;
  timestamp: number;
  balance: string;
  token: string;
  identifier: string;
  tokenNonce: number;
  isSmartContract: boolean;
}
