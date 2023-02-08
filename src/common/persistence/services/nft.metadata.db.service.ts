import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { InjectRepository } from "@nestjs/typeorm";
import { PersistenceService, isPassThrough } from "../persistence.service";
import { NftMetadataDb } from "../entities/nft.metadata.db";

@Injectable()
export class NftMetadataDbService extends PersistenceService {
  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
  ) {
    super();
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async getMetadata(identifier: string): Promise<any | null> {
    const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'batchGetMetadata')
  @ErrorLoggerAsync({ logArgs: true })
  async batchGetMetadata(identifiers: string[]): Promise<Record<string, any>> {
    const metadatasDb = await this.nftMetadataRepository.find({
      where: {
        id: {
          // @ts-ignore
          $in: identifiers,
        },
      },
    });

    return metadatasDb.toRecord(metadata => metadata.id, metadata => metadata.content);
  }

  @PassthroughAsync(isPassThrough)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setMetadata')
  @ErrorLoggerAsync()
  async setMetadata(identifier: string, content: any): Promise<void> {
    let metadata = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
    if (!metadata) {
      metadata = new NftMetadataDb();
    }

    metadata.id = identifier;
    metadata.content = content;

    await this.save(this.nftMetadataRepository, metadata);
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'deleteMetadata')
  @ErrorLoggerAsync()
  async deleteMetadata(identifier: string): Promise<any> {
    return await this.nftMetadataRepository.delete({ id: identifier });
  }
}
