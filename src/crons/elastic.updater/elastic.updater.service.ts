import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Locker } from "src/utils/locker";
import { ElasticService } from "src/common/elastic/elastic.service";
import * as JsonDiff from "json-diff";
import { TokenAssetService } from "src/endpoints/tokens/token.asset.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryType } from "src/common/elastic/entities/query.type";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import asyncPool from "tiny-async-pool";
@Injectable()
export class ElasticUpdaterService {
  private readonly logger: Logger;

  constructor(
    private readonly tokenAssetService: TokenAssetService,
    private readonly elasticService: ElasticService,
    private readonly nftService: NftService,
  ) {
    this.logger = new Logger(ElasticUpdaterService.name);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleUpdateAssets() {
    await Locker.lock('Elastic updater: Update assets', async () => {
      const allAssets = await this.tokenAssetService.getAllAssets();

      for (const key of Object.keys(allAssets)) {
        const elasticAssets = await this.elasticService.getCustomValue('tokens', key, 'assets');
        if (elasticAssets === null) {
          this.logger.log(`Could not find token with identifier '${key}' when updating assets in elastic`);
          continue;
        }

        const githubAssets = allAssets[key];

        if (!elasticAssets || JsonDiff.diff(githubAssets, elasticAssets)) {
          this.logger.log(`Updating assets for token with identifier '${key}'`);
          await this.elasticService.setCustomValue('tokens', key, 'assets', githubAssets);
        }
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleUpdateIsWhitelisted() {
    await Locker.lock('Elastic updater: Update isWhitelisted', async () => {
      const query = ElasticQuery.create()
        .withFields([
          'api_isWhitelistedStorage',
          'data.uris',
        ])
        .withMustCondition(QueryType.Exists('identifier'))
        .withShouldCondition([
          QueryType.Match('type', TokenType.NonFungibleESDT),
          QueryType.Match('type', TokenType.SemiFungibleESDT),
        ])
        .withPagination({ from: 0, size: 10000 });

      await this.elasticService.getListWithScroll('tokens', 'identifier', query, async items => {
        const itemsToUpdate: { identifier: string, isWhitelistedStorage: boolean }[] = [];

        for (const item of items) {
          const computedIsWhitelistedStorage = this.nftService.isWhitelistedStorage(item.data?.uris);
          const actualIsWhitelistedStorage = item.api_isWhitelistedStorage;

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
          async item => await this.elasticService.setCustomValue('tokens', item.identifier, 'isWhitelistedStorage', item.isWhitelistedStorage)
        );
      });
    }, true);
  }
}
