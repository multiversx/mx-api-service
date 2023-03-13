import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { Repository } from "typeorm";
import { NftMediaDb } from "../entities/nft.media.db";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { InjectRepository } from "@nestjs/typeorm";
import { PersistenceService, isPassThrough } from "../persistence.service";

@Injectable()
export class NftMediaDbService extends PersistenceService {
  constructor(
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
  ) {
    super();
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getMedia')
  @ErrorLoggerAsync({ logArgs: true })
  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!media) {
      return null;
    }

    return media.content;
  }

  @PassthroughAsync(isPassThrough, {})
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'batchGetMedia')
  @ErrorLoggerAsync({ logArgs: true })
  async batchGetMedia(identifiers: string[]): Promise<Record<string, NftMedia[]>> {
    const mediasDb = await this.nftMediaRepository.find({
      where: {
        id: {
          // @ts-ignore
          $in: identifiers,
        },
      },
    });

    return mediasDb.toRecord(media => media.id ?? '', media => media.content);
  }

  @PassthroughAsync(isPassThrough)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setMedia')
  @ErrorLoggerAsync()
  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    let value = await this.nftMediaRepository.findOne({ where: { id: identifier } });
    if (!value) {
      value = new NftMediaDb();
    }

    value.id = identifier;
    value.content = media;

    await this.save(this.nftMediaRepository, value);
  }
}
