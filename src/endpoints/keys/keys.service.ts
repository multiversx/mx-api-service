import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { KeyUnbondPeriod } from "./entities/key.unbond.period";
import { StakingContractService } from "../vm.query/contracts/staking.contract.service";

@Injectable()
export class KeysService {
  private readonly logger = new OriginLogger(KeysService.name);

  constructor(
    private readonly stakingContractService: StakingContractService
  ) { }

  async getKeyUnbondPeriod(key: string): Promise<KeyUnbondPeriod | undefined> {
    try {
      const encoded = await this.stakingContractService.getRemainingUnBondPeriod(key);
      let remainingUnBondPeriod = parseInt(Buffer.from(encoded[0], 'base64').toString('ascii'));

      if (isNaN(remainingUnBondPeriod)) {
        remainingUnBondPeriod = encoded[0].length
          ? parseInt(Buffer.from(encoded[0], 'base64').toString('hex'), 16)
          : 0;
      }

      return { remainingUnBondPeriod };
    } catch (error) {
      this.logger.error(`Error when getting key unbond period for key '${key}'`);
      this.logger.error(error);
      return undefined;
    }
  }
}
