export const GENESIS_TIMESTAMP_SERVICE = 'GENESIS TIMESTAMP SERVICE';

export interface GenesisTimestampInterface {
  getSecondsRemainingUntilNextRound(): Promise<number>;
}