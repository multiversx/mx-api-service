import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { PerformanceProfiler } from "src/utils/performance.profiler";

@Injectable()
export class VmQueryService {
  private readonly logger: Logger;

  constructor(
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly protocolService: ProtocolService,
    private readonly apiConfigService: ApiConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger = new Logger(VmQueryService.name);
  }

  private async computeTtls(): Promise<{ localTtl: number, remoteTtl: number }> {
    const secondsRemainingUntilNextRound = await this.protocolService.getSecondsRemainingUntilNextRound();

    // no need to store value remotely just to evict it one second later
    const remoteTtl = secondsRemainingUntilNextRound > 1 ? secondsRemainingUntilNextRound : 0;

    return {
      localTtl: secondsRemainingUntilNextRound,
      remoteTtl,
    };
  }

  async vmQueryFullResult(contract: string, func: string, caller: string | undefined = undefined, value: string | undefined = undefined, args: string[] = []): Promise<any> {
    let key = `vm-query:${contract}:${func}`;
    if (caller) {
      key += `:${caller}`;
    }

    if (args.length > 0) {
      key += `@${args.join('@')}`;
    }

    const { localTtl, remoteTtl } = await this.computeTtls();

    return await this.cachingService.getOrSetCache(
      key,
      async () => await this.vmQueryRaw(contract, func, caller, value, args),
      remoteTtl,
      localTtl
    );
  }

  async vmQuery(contract: string, func: string, caller: string | undefined = undefined, value: string | undefined = undefined, args: string[] = [], skipCache: boolean = false): Promise<string[]> {
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
        result = await this.vmQueryRaw(contract, func, caller, value, args);
      } else {

        const { localTtl, remoteTtl } = await this.computeTtls();

        result = await this.cachingService.getOrSetCache(
          key,
          async () => await this.vmQueryRaw(contract, func, caller, value, args),
          remoteTtl,
          localTtl
        );
      }

      const data = result.data.data;

      return 'ReturnData' in data ? data.ReturnData : data.returnData;
    } catch (error: any) {
      this.logger.error(`Error in vm query for address '${contract}', function '${func}', caller '${caller}', value '${value}', args '${JSON.stringify(args)}'. Error message: ${error.response?.data?.error}`);
      throw error;
    }
  }

  async vmQueryRaw(contract: string, func: string, caller: string | undefined, value: string | undefined, args: string[] = []): Promise<any> {
    const payload = {
      scAddress: contract,
      funcName: func,
      caller: caller,
      value: value,
      args: args,
    };

    const profiler = new PerformanceProfiler();

    try {
      const result = await this.gatewayService.createRaw(
        'vm-values/query',
        GatewayComponentRequest.vmQuery,
        payload,
      );

      return result.data;
    } finally {
      profiler.stop();

      if (this.apiConfigService.getUseVmQueryTracingFlag()) {
        this.metricsService.setVmQuery(contract, func, profiler.duration);
      }
    }
  }
}
