export interface Collection {
  name: string;
  ticker: string;
  token: string;
  issuer: string;
  currentOwner: string;
  type: string;
  timestamp: number;
  ownersHistory: { address: string, timestamp: number }[];
}
