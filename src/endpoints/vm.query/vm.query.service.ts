import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { GatewayService } from "src/common/external/gateway.service";
import { Constants } from "src/utils/constants";

@Injectable()
export class VmQueryService {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService
  ) {
    this.logger = new Logger(VmQueryService.name);
  }

  private async computeTtls(contract: string, func: string): Promise<{localTtl: number, remoteTtl: number}> {
    let isCachingQueryFunction = await this.cachingService.isCachingQueryFunction(contract, func);
    let secondsRemainingUntilNextRound = await this.cachingService.getSecondsRemainingUntilNextRound();

    let localTtl = isCachingQueryFunction ? Constants.oneHour() : secondsRemainingUntilNextRound;

    // no need to store value remotely just to evict it one second later
    let remoteTtl = localTtl > 1 ? localTtl : 0;

    return {
      localTtl,
      remoteTtl,
    }
  }

  async vmQueryFullResult(contract: string, func: string, caller: string | undefined = undefined, args: string[] = []): Promise<any> {
    let key = `vm-query:${contract}:${func}`;
    if (caller) {
      key += `:${caller}`;
    }

    if (args.length > 0) {
      key += `@${args.join('@')}`;
    }

    const { localTtl, remoteTtl } = await this.computeTtls(contract, func);

    return await this.cachingService.getOrSetCache(
      key,
      async () => await this.vmQueryRaw(contract, func, caller, args),
      remoteTtl,
      localTtl
    );
  }

  async vmQuery(contract: string, func: string, caller: string | undefined = undefined, args: string[] = [], skipCache: boolean = false): Promise<string[]> {
    let key = `vm-query:${contract}:${func}`;
    if (caller) {
      key += `:${caller}`;
    }

    if (args.length > 0) {
      key += `@${args.join('@')}`;
    }

    try {
      let result: any;
      if (skipCache) {
        result = await this.vmQueryRaw(contract, func, caller, args);
      } else {
        
        const { localTtl, remoteTtl } = await this.computeTtls(contract, func);
        
        result = await this.cachingService.getOrSetCache(
          key,
          async () => await this.vmQueryRaw(contract, func, caller, args),
          remoteTtl,
          localTtl
        );
      }

      let data = result.data.data;

      return 'ReturnData' in data ? data.ReturnData : data.returnData;
    } catch (error: any) {
      this.logger.error(`Error in vm query for address '${contract}', function '${func}', caller '${caller}', args '${JSON.stringify(args)}'. Error message: ${error.response?.data?.error}`);
      throw error;
    }
  }

  async vmQueryRaw(contract: string, func: string, caller: string | undefined, args: string[] = []): Promise<any> {
    let payload = { 
      scAddress: contract, 
      FuncName: func, 
      caller: caller, 
      args: args,
    };

    let result = await this.gatewayService.createRaw(
      'vm-values/query',
      payload,
    );

    return result.data;
  };
}