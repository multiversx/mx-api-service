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
import { AuctionsFilter } from "./entities/auctions.filter";
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

  async getAuctions(queryPagination: QueryPagination, filter: AuctionsFilter): Promise<Auctions[]> {
    const { size } = queryPagination;

    let auctions = await this.getFilteredAuctions(filter);

    auctions = auctions.slice(0, 0 + size);

    return auctions;
  }

  async getFilteredAuctions(filter: AuctionsFilter): Promise<Auctions[]> {
    let auctions = await this.getAuctionsRaw(new QueryPagination({ size: 10000 }));

    if (filter.marketplace) {
      auctions = auctions.filter(auction => auction.marketplace.includes(filter.marketplace));
    }
    return auctions;
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

  async getAuctionById(auctionId: string): Promise<Auctions | undefined> {
    const auctions = await this.getAuctionsRaw(new QueryPagination({ size: 10000 }));
    const auction = auctions.find(x => x.id === auctionId);
    if (!auction) {
      return undefined;
    }

    return auction;
  }

  async getAuctionsCount(filter: AuctionsFilter): Promise<number> {
    const auctions = await this.getFilteredAuctions(filter);

    return auctions.length;
  }

  async getAuctionsRaw(pagination: QueryPagination): Promise<Auctions[]> {
    const variables = {
      "first": pagination.size,
    };

    const result: any = await this.graphQlService.getNftServiceData(auctionsQuery, variables);
    if (!result) {
      return [];
    }

    const auctions = result.auctions.edges.map((auction: any) => {
      const auctions = new Auctions();

      auctions.identifier = auction.node.identifier;
      auctions.collection = auction.node.collection;
      auctions.nonce = auction.node.nonce;
      auctions.id = auction.node.id;
      auctions.marketPlaceId = auction.node.marketplaceAuctionId;
      auctions.marketplace = auction.node.marketplaceKey;
      auctions.minBid.amount = auction.node.minBid.amount;
      auctions.minBid.token = auction.node.minBid.token;
      auctions.maxBid.amount = auction.node.maxBid.amount;
      auctions.maxBid.token = auction.node.maxBid.token;
      auctions.timestamp = auction.node.creationDate;
      auctions.ownerAddress = auction.node.ownerAddress;

      return auctions;
    });

    return auctions;
  }
}
