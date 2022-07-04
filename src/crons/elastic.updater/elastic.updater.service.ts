import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as JsonDiff from "json-diff";
import { AssetsService } from "src/common/assets/assets.service";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import asyncPool from "tiny-async-pool";
import { PersistenceInterface } from "src/common/persistence/persistence.interface";
import { BatchUtils, ElasticQuery, Locker, QueryType } from "@elrondnetwork/erdnest";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
@Injectable()
export class ElasticUpdaterService {
  private readonly logger: Logger;

  constructor(
    private readonly assetsService: AssetsService,
    private readonly indexerService: ElasticIndexerService,
    private readonly nftService: NftService,
    @Inject('PersistenceService')
    private readonly persistenceService: PersistenceInterface,
  ) {
    this.logger = new Logger(ElasticUpdaterService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleUpdateAssets() {
    await Locker.lock('Elastic updater: Update assets', async () => {
      const allAssets = await this.assetsService.getAllTokenAssets();

      for (const key of Object.keys(allAssets)) {
        const elasticAssets = await this.indexerService.getCustomValue('tokens', key, 'assets');
        if (elasticAssets === null) {
          this.logger.log(`Could not find token with identifier '${key}' when updating assets in elastic`);
          continue;
        }

        const githubAssets = allAssets[key];

        if (!elasticAssets || JsonDiff.diff(githubAssets, elasticAssets)) {
          this.logger.log(`Updating assets for token with identifier '${key}'`);
          await this.indexerService.setCustomValue('tokens', key, 'assets', githubAssets);
        }
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenExtraDetails() {
    await Locker.lock('Elastic updater: Update tokens isWhitelisted, media, metadata', async () => {
      const query = ElasticQuery.create()
        .withFields([
          'api_isWhitelistedStorage',
          'api_media',
          'api_metadata',
          'data.uris',
        ])
        .withMustExistCondition('identifier')
        .withMustMultiShouldCondition([TokenType.NonFungibleESDT, TokenType.SemiFungibleESDT], type => QueryType.Match('type', type))
        .withPagination({ from: 0, size: 10000 });

      await this.indexerService.getScrollableList('tokens', 'identifier', query, async items => {
        const whitelistStorageItems = items.map(item => ({
          identifier: item.identifier,
          uris: item.data?.uris,
          isWhitelistedStorage: item.api_isWhitelistedStorage,
        }));

        await this.updateIsWhitelistedStorageForTokens(whitelistStorageItems);

        const mediaItems = items.map(item => ({
          identifier: item.identifier,
          media: item.api_media,
        }));

        await this.updateMediaForTokens(mediaItems);

        const metadataItems = items.map(item => ({
          identifier: item.identifier,
          metadata: item.api_metadata,
        }));

        await this.updateMetadataForTokens(metadataItems);
      });
    }, true);
  }

  private async updateMetadataForTokens(items: { identifier: string, metadata: any }[]): Promise<void> {
    const indexedItems = items.toRecord(item => item.identifier);

    const metadataResult = await BatchUtils.batchGet(
      items,
      item => item.identifier,
      async elements => await this.persistenceService.batchGetMetadata(elements.map(x => x.identifier)),
      100
    );

    const itemsToUpdate: { identifier: string, metadata: any }[] = [];

    for (const identifier of Object.keys(metadataResult)) {
      const item: any = indexedItems[identifier];
      if (!item) {
        continue;
      }

      const currentMetadata = metadataResult[identifier];
      const actualMetadata = item.metadata;

      if (JsonDiff.diff(currentMetadata, actualMetadata)) {
        itemsToUpdate.push({
          identifier: identifier,
          metadata: currentMetadata,
        });
      }
    }

    await asyncPool(
      5,
      itemsToUpdate,
      async item => await this.updateMetadataForToken(item.identifier, item.metadata)
    );
  }

  private async updateMediaForTokens(items: { identifier: string, media: NftMedia[] }[]): Promise<void> {
    const indexedItems = items.toRecord(item => item.identifier);

    const mediaResult = await BatchUtils.batchGet(
      items,
      item => item.identifier,
      async elements => await this.persistenceService.batchGetMedia(elements.map(x => x.identifier)),
      100
    );

    const itemsToUpdate: { identifier: string, media: NftMedia[] }[] = [];

    for (const identifier of Object.keys(mediaResult)) {
      const item: any = indexedItems[identifier];
      if (!item) {
        continue;
      }

      const currentMedia = mediaResult[identifier];
      const actualMedia = item.media;

      if (JsonDiff.diff(currentMedia, actualMedia)) {
        itemsToUpdate.push({
          identifier: identifier,
          media: currentMedia,
        });
      }
    }

    await asyncPool(
      5,
      itemsToUpdate,
      async item => await this.updateMediaForToken(item.identifier, item.media)
    );
  }

  private async updateIsWhitelistedStorageForTokens(items: { identifier: string, uris: string[] | undefined, isWhitelistedStorage: boolean | undefined }[]): Promise<void> {
    const itemsToUpdate: { identifier: string, isWhitelistedStorage: boolean }[] = [];

    for (const item of items) {
      const computedIsWhitelistedStorage = this.nftService.isWhitelistedStorage(item.uris);
      const actualIsWhitelistedStorage = item.isWhitelistedStorage;

      if (computedIsWhitelistedStorage !== actualIsWhitelistedStorage) {
        const itemToUpdate = {
          identifier: item.identifier,
          isWhitelistedStorage: computedIsWhitelistedStorage,
        };

        itemsToUpdate.push(itemToUpdate);
      }
    }

    await asyncPool(
      5,
      itemsToUpdate,
      async item => await this.updateIsWhitelistedStorageForToken(item.identifier, item.isWhitelistedStorage)
    );
  }

  private async updateIsWhitelistedStorageForToken(identifier: string, isWhitelistedStorage: boolean): Promise<void> {
    try {
      this.logger.log(`Setting api_isWhitelistedStorage for token with identifier '${identifier}'`);
      await this.indexerService.setCustomValue('tokens', identifier, 'isWhitelistedStorage', isWhitelistedStorage);
    } catch (error) {
      this.logger.error(`Unexpected error when updating isWhitelistedStorage for token with identifier '${identifier}'`);
    }
  }

  private async updateMediaForToken(identifier: string, media: NftMedia[]): Promise<void> {
    try {
      this.logger.log(`Setting api_media for token with identifier '${identifier}'`);
      await this.indexerService.setCustomValue('tokens', identifier, 'media', media);
    } catch (error) {
      this.logger.error(`Unexpected error when updating media for token with identifier '${identifier}'`);
    }
  }

  private async updateMetadataForToken(identifier: string, metadata: any): Promise<void> {
    try {
      this.logger.log(`Setting api_metadata for token with identifier '${identifier}'`);
      await this.indexerService.setCustomValue('tokens', identifier, 'metadata', metadata);
    } catch (error) {
      this.logger.error(`Unexpected error when updating metadata for token with identifier '${identifier}'`);
    }
  }
}
