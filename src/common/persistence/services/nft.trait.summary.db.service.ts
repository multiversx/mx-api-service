import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { ObjectLiteral, Repository } from "typeorm";
import { NftTraitSummaryDb } from "../entities/nft.trait.summary.db";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { InjectRepository } from "@nestjs/typeorm";
import { PersistenceService, isPassThrough } from "../persistence.service";


@Injectable()
export class NftTraitSummaryDbService extends PersistenceService {
  constructor(
    @InjectRepository(NftTraitSummaryDb)
    private readonly nftTraitSummaryRepository: Repository<NftTraitSummaryDb>,
  ) {
    super();
  }

  async save<T extends ObjectLiteral>(repository: Repository<T>, entity: T) {
    try {
      // @ts-ignore
      await repository.save(entity);
    } catch (error) {
      // @ts-ignore
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getCollectionTraits')
  @ErrorLoggerAsync({ logArgs: true })
  async getCollectionTraits(collection: string): Promise<CollectionTrait[] | null> {
    const summary: NftTraitSummaryDb | null = await this.nftTraitSummaryRepository.findOne({ where: { identifier: collection } });
    if (!summary) {
      return null;
    }

    return summary.traitTypes;
  }
}
