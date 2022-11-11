import { OriginLogger } from "@elrondnetwork/erdnest";
import { PerformanceProfiler, CachingService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { LogMetricsEvent } from "src/common/metrics/events/log-metrics.event";
import { MetricsEvents } from "src/utils/metrics-events.constants";

@Injectable()
export class VmQueryService {
  private readonly logger = new OriginLogger(VmQueryService.name);

  constructor(
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly protocolService: ProtocolService,
    private readonly apiConfigService: ApiConfigService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  private async computeTtls(): Promise<{ localTtl: number, remoteTtl: number; }> {
    const secondsRemainingUntilNextRound = await this.protocolService.getSecondsRemainingUntilNextRound();

    // no need to store value remotely just to evict it one second later
    const remoteTtl = secondsRemainingUntilNextRound > 1 ? secondsRemainingUntilNextRound : 0;

    return {
      localTtl: secondsRemainingUntilNextRound,
      remoteTtl,
    };
  }

  async vmQueryFullResult(contract: string, func: string, caller: string | undefined = undefined, args: string[] = [], value: string | undefined = undefined): Promise<any> {
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
      async () => await this.vmQueryRaw(contract, func, caller, args, value),
      remoteTtl,
      localTtl
    );
  }

  async vmQuery(contract: string, func: string, caller: string | undefined = undefined, args: string[] = [], value: string | undefined = undefined, skipCache: boolean = false): Promise<string[]> {
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
        result = await this.vmQueryRaw(contract, func, caller, args, value);
      } else {

        const { localTtl, remoteTtl } = await this.computeTtls();

        result = await this.cachingService.getOrSetCache(
          key,
          async () => await this.vmQueryRaw(contract, func, caller, args, value),
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

  async vmQueryRaw(contract: string, func: string, caller: string | undefined, args: string[] = [], value: string | undefined = undefined): Promise<any> {
    const payload = {
      scAddress: contract,
      funcName: func,
      caller: caller,
      args: args,
      value: value,
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
        const metricsEvent = new LogMetricsEvent();
        metricsEvent.args = [contract, func, profiler.duration];
        this.eventEmitter.emit(
          MetricsEvents.SetVmQuery,
          metricsEvent
        );
      }
    }
  }
}
