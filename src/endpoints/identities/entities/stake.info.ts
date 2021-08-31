export class StakeInfo {
  score?: number;
  validators?: number;
  stake?: string;
  topUp?: string;
  locked?: string;
  distribution?: {[key: string]: number};
  providers?: any[];
  stakePercent?: number;
  sort?: number;
}