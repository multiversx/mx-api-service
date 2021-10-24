import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { KeyUnbondPeriod } from "./entities/key.unbond.period";

@Injectable()
export class KeysService {
  private readonly logger: Logger

  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(KeysService.name);
  }

  async getKeyUnbondPeriod(key: string): Promise<KeyUnbondPeriod | undefined> {
    try {
      const encoded = await this.vmQueryService.vmQuery(
        this.apiConfigService.getStakingContractAddress(),
        'getRemainingUnBondPeriod',
        undefined,
        [ key ]
      );

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