import { ContextTracker } from "@multiversx/sdk-nestjs-common";
import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { Response } from 'express';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class DeepHistoryInterceptor implements NestInterceptor {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly apiConfigService: ApiConfigService,
    private readonly protocolService: ProtocolService,
    private readonly cacheService: CacheService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest();

    const timestamp = Number(request.query?.timestamp);
    if (Number.isNaN(timestamp)) {
      return next.handle();
    }

    const address = request.params.address ?? request.body.scAddress;
    if (!address) {
      return next.handle();
    }

    if (!this.apiConfigService.isDeepHistoryGatewayEnabled()) {
      throw new BadRequestException('Deep history is not enabled. Timestamp query parameter in this context is unsupported');
    }

    const shardId = await this.protocolService.getShardIdForAddress(address);
    if (shardId === undefined) {
      throw new BadRequestException('Could not determine shard based on the provided address');
    }

    const block = await this.cacheService.getOrSet(
      CacheInfo.DeepHistoryBlock(timestamp, shardId).key,
      async () => await this.indexerService.getBlockByTimestampAndShardId(timestamp, shardId),
      CacheInfo.DeepHistoryBlock(timestamp, shardId).ttl,
    );

    if (!block) {
      throw new BadRequestException('Could not determine block nonce based on the provided timestamp and the shardId associated with the given address');
    }

    const blockNonce = block.nonce;

    ContextTracker.assign({ deepHistoryBlockNonce: blockNonce });

    return next
      .handle()
      .pipe(
        tap(() => {
          const contextObj = ContextTracker.get();
          const blockInfo = contextObj?.deepHistoryBlockInfo;
          if (blockInfo) {
            response.setHeader('X-Deep-History-Block-Hash', blockInfo.hash);
            response.setHeader('X-Deep-History-Block-Nonce', blockInfo.nonce);
            response.setHeader('X-Deep-History-Block-RootHash', blockInfo.rootHash);
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
}
