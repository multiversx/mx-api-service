import { BadRequestException, Injectable } from "@nestjs/common";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountAuctionStats } from "./entities/account.auction.stats";
import { Auction } from "./entities/account.auctions";
import { CollectionAuctionStats } from "./entities/collection.auction.stats";
import { CollectionStatsFilters } from "./entities/collection.stats.filter";
import { ExploreCollectionsStats } from "./entities/explore.collections.stats";
import { accountAuctionsQuery } from "./graphql/account.auctions.query";
import { accountStatsQuery } from "./graphql/account.stats.query";
import { collectionStatsQuery } from "./graphql/collection.stats.query";
import { collectionsStatsQuery } from "./graphql/explore.query";
import { Auctions } from "./entities/auctions";
import { auctionsQuery } from "./graphql/auctions.query";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AuctionStatus } from "./entities/auction.status";
import BigNumber from "bignumber.js";

@Injectable()
export class NftMarketplaceService {
  constructor(
    private readonly graphQlService: GraphQlService,
  ) { }

  async getAccountStats(address: string): Promise<AccountAuctionStats> {
    const variables = { filters: { address } };
    const result: any = await this.graphQlService.getNftServiceData(accountStatsQuery, variables);
    if (!result) {
      throw new BadRequestException('Count not fetch accountsStats data from Nft Marketplace');
    }

    return {
      auctions: parseInt(result.accountStats.auctions),
      claimable: parseInt(result.accountStats.claimable),
      collected: parseInt(result.accountStats.collected),
      collections: parseInt(result.accountStats.collections),
      creations: parseInt(result.accountStats.creations),
      likes: parseInt(result.accountStats.likes),
      orders: parseInt(result.accountStats.orders),
    };
  }

  async getCollectionStats(filters: CollectionStatsFilters): Promise<CollectionAuctionStats> {
    const variables = { filters };
    const result: any = await this.graphQlService.getNftServiceData(collectionStatsQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch collectionStats data from Nft Marketplace');
    }

    return {
      activeAuctions: result.collectionStats.activeAuctions,
      endedAuctions: result.collectionStats.auctionsEnded,
      maxPrice: result.collectionStats.maxPrice,
      minPrice: result.collectionStats.minPrice,
      saleAverage: new BigNumber(result.collectionStats.saleAverage).toFixed(0),
      volumeTraded: result.collectionStats.volumeTraded,
    };
  }

  async getExploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    const result: any = await this.graphQlService.getNftServiceData(collectionsStatsQuery, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreCollectionsStats data from Nft Marketplace');
    }

    return {
      verifiedCount: result.exploreCollectionsStats.verifiedCount,
      activeLast30DaysCount: result.exploreCollectionsStats.activeLast30DaysCount,
    };
  }

  async getAccountAuctions(queryPagination: QueryPagination, address: string, state?: AuctionStatus): Promise<Auction[]> {
    const { from, size } = queryPagination;
    const result: any = await this.graphQlService.getNftServiceData(accountAuctionsQuery(address, state), {});
    if (!result) {
      return [];
    }

    const auctions = result.auctions.edges.map((auction: any) => {
      const accountAuction = new Auction();

      accountAuction.auctionId = auction.node.id;
      accountAuction.identifier = auction.node.identifier;
      accountAuction.collection = auction.node.collection;
      accountAuction.status = auction.node.status.toLowerCase();
      accountAuction.createdAt = auction.node.creationDate;
      accountAuction.endsAt = auction.node.endDate;
      accountAuction.marketplace = auction.node.marketplace.key;
      accountAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
      accountAuction.tags = auction.node.tags;

      return accountAuction;
    });

    return auctions.slice(from, from + size);
  }

  async getAuctions(pagination: QueryPagination): Promise<Auctions[]> {
    let hasNextPage = true;
    let after = null;

    const pageSize = pagination.size;
    const totalPages = Math.ceil(pagination.size / pageSize);

    let pagesLeft = Math.min(totalPages, 3); // Fetch up to 3 pages by default

    if (pagination.size > 25) {
      pagesLeft = totalPages;
    }

    const auctions: Auctions[] = [];

    while (hasNextPage && pagesLeft > 0) {
      const variables = {
        "first": pageSize,
        "after": after,
      };

      const result: any = await this.graphQlService.getNftServiceData(auctionsQuery, variables);

      if (!result) {
        return auctions;
      }

      const edges = result.auctions.edges;
      const pageInfo = result.auctions.pageInfo;
      const endCursor = pageInfo.endCursor;

      if (edges.length > 0) {
        const currentAuctions = edges.map((auction: any) => {
          const currentAuction = new Auctions();
          currentAuction.owner = auction.node.ownerAddress;
          currentAuction.identifier = auction.node.identifier;
          currentAuction.collection = auction.node.collection;
          currentAuction.nonce = auction.node.nonce;
          currentAuction.id = auction.node.id;
          currentAuction.marketPlaceId = auction.node.marketplaceAuctionId;
          currentAuction.marketplace = auction.node.marketplaceKey;
          currentAuction.createdAt = auction.node.creationDate;
          currentAuction.minBid.amount = auction.node.minBid.amount;
          currentAuction.minBid.token = auction.node.minBid.token;
          currentAuction.maxBid.amount = auction.node.maxBid.amount;
          currentAuction.maxBid.token = auction.node.maxBid.token;

          return currentAuction;
        });
        auctions.push(...currentAuctions);
      }

      if (pagesLeft > 1 && pageInfo.hasNextPage) {
        after = endCursor;
        pagesLeft--;
      } else {
        hasNextPage = false;
      }
    }

    if (hasNextPage) {
      const remainingAuctions = await this.getAuctions({
        ...pagination,
        size: pagination.size - auctions.length,
      });
      auctions.push(...remainingAuctions);
    }

    return auctions;
  }
}
