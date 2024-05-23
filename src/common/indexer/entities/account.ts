export interface Account {
  address: string;
  nonce: number;
  timestamp: number;
  balance: string;
  balanceNum: number;
  totalBalanceWithStake: string;
  totalBalanceWithStakeNum: number;
  currentOwner?: string;
  api_assets?: any;
  api_transfersLast24h?: number;
}
