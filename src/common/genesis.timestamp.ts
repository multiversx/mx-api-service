export const GENESIS_TIMESTAMP_SERVICE = 'GENESIS TIMESTAMP SERVICE';

export interface IGenesisTimestamp {
  getSecondsRemainingUntilNextRound(): Promise<number>;
}