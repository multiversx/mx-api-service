export class RoundUtils {
  static roundToEpoch(round: number): number {
    return Math.floor(round / 14401);
  }

  static getExpires(epochs: number, roundsPassed: number, roundsPerEpoch: number, roundDuration: number) {
    const now = Math.floor(Date.now() / 1000);

    if (epochs === 0) {
      return now;
    }

    const fullEpochs = (epochs - 1) * roundsPerEpoch * roundDuration;
    const lastEpoch = (roundsPerEpoch - roundsPassed) * roundDuration;

    return now + fullEpochs + lastEpoch;
  }
}
