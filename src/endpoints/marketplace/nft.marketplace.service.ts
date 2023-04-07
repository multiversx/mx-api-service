import { BadRequestException, Injectable } from "@nestjs/common";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountAuctionStats } from "./entities/account.auction.stats";
import { Auction } from "./entities/account.auctions";
import { CollectionAuctionStats } from "./entities/collection.auction.stats";
import { CollectionStatsFilters } from "./entities/collection.stats.filter";
import { accountAuctionsQuery } from "./graphql/account.auctions.query";
import { accountStatsQuery } from "./graphql/account.stats.query";
import { collectionStatsQuery } from "./graphql/collection.stats.query";
import { Auctions } from "./entities/auctions";
import { auctionsQuery } from "./graphql/auctions.query";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AuctionStatus } from "./entities/auction.status";
import BigNumber from "bignumber.js";
import { auctionIdQuery } from "./graphql/auctionId.query";
import { auctionsCountQuery } from "./graphql/auctions.count.query";
import { collectionAuctionsQuery } from "./graphql/collection.auctions.query";

@Injectable()
export class NftMarketplaceService {
  constructor(
    private readonly graphQlService: GraphQlService,
  ) { }

  async getAccountStats(address: string): Promise<AccountAuctionStats> {
    const variables = { filters: { address } };
    const result: any = await this.graphQlService.getNftServiceData(accountStatsQuery, variables);
    if (!result) {
      throw new BadRequestException('Count not fetch data from nft service');
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
      throw new BadRequestException('Count not fetch data from nft service');
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

  async getAccountAuctions(queryPagination: QueryPagination, address: string, state?: AuctionStatus): Promise<Auction[]> {
    const { from, size } = queryPagination;
    const result: any = await this.graphQlService.getNftServiceData(accountAuctionsQuery(address, state), {});
    if (!result) {
      return [];
    }

    const auctions = result.auctions.edges.map((auction: any) => {
      const accountAuction = new Auction();

      accountAuction.auctionId = parseInt(auction.node.id);
      accountAuction.identifier = auction.node.identifier;
      accountAuction.collection = auction.node.collection;
      accountAuction.status = auction.node.status.toLowerCase();
      accountAuction.createdAt = auction.node.creationDate;
      accountAuction.endsAt = auction.node.endDate !== 0 ? auction.endDate : undefined;
      accountAuction.marketplace = auction.node.marketplace.key;
      accountAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
      accountAuction.minBid.amount = auction.node.minBid.amount;
      accountAuction.minBid.token = auction.node.minBid.token;
      accountAuction.maxBid.amount = auction.node.maxBid.amount;
      accountAuction.maxBid.token = auction.node.maxBid.token;

      return accountAuction;
    });

    return auctions.slice(from, from + size);
  }

  async getAuctionId(id: number): Promise<Auction> {
    const result = await this.graphQlService.getNftServiceData(auctionIdQuery(id), {});

    if (!result) {
      throw new BadRequestException('Count not fetch data from nft service');
    }

    const auction = result.auctions.edges[0].node;

    const auctionData: Auction = {
      owner: auction.ownerAddress,
      identifier: auction.identifier,
      collection: auction.collection,
      status: auction.status.toLowerCase(),
      auctionType: auction.type,
      createdAt: auction.creationDate,
      endsAt: auction.endDate !== 0 ? auction.endDate : undefined,
      marketplaceAuctionId: auction.marketplaceAuctionId,
      marketplace: auction.marketplace.key,
      minBid: {
        amount: auction.minBid.amount,
        token: auction.minBid.token,
      },
      maxBid: {
        amount: auction.maxBid.amount,
        token: auction.maxBid.token,
      },
    };

    return auctionData;
  }

  async getAuctions(pagination: QueryPagination): Promise<Auctions[]> {
    let hasNextPage = true;
    let after = null;

    const pageSize = pagination.size;
    const totalPages = Math.ceil(pagination.size / pageSize);
    const currentTimestamp = Math.round(Date.now() / 1000).toString();

    let pagesLeft = Math.min(totalPages, 3); // Fetch up to 3 pages by default

    if (pagination.size > 25) {
      pagesLeft = totalPages;
    }

    const auctions: Auctions[] = [];

    while (hasNextPage && pagesLeft > 0) {
      const variables = {
        "first": pageSize,
        "after": after,
        "currentTimestamp": currentTimestamp,
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
          currentAuction.status = auction.node.status.toLowerCase();
          currentAuction.auctionType = auction.node.type;
          currentAuction.auctionId = parseInt(auction.node.id);
          currentAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
          currentAuction.marketplace = auction.node.marketplaceKey;
          currentAuction.createdAt = auction.node.creationDate;
          currentAuction.endsAt = auction.node.endDate !== 0 ? auction.endDate : undefined;
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

  async getAuctionsCount(status?: AuctionStatus): Promise<number> {
    const variables = {
      filters: {
        filters: [
          {
            field: 'status',
            op: 'IN',
            values: [status],
          },
        ],
        operator: 'AND',
      },
    };

    const result: any = await this.graphQlService.getNftServiceData(auctionsCountQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch data from nft service');
    }

    return result.auctions.pageData.count;
  }

  async getCollectionAuctionsCount(collection: string): Promise<number> {
    const variables = {
      filters: {
        filters: [
          {
            field: "status",
            op: "EQ",
            values: ["Running"],
          },
          {
            field: 'collection',
            op: 'EQ',
            values: [collection],
          },
        ],
        operator: 'AND',
      },
    };

    const result: any = await this.graphQlService.getNftServiceData(auctionsCountQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch data from nft service');
    }

    return result.auctions.pageData.count;
  }

  async getAccountAuctionsCount(address: string): Promise<number> {
    const variables = {
      filters: {
        filters: [
          {
            field: "status",
            op: "EQ",
            values: ["Running"],
          },
          {
            field: 'ownerAddress',
            op: 'EQ',
            values: [address],
          },
        ],
        operator: 'AND',
      },
    };

    const result: any = await this.graphQlService.getNftServiceData(auctionsCountQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch data from nft service');
    }

    return result.auctions.pageData.count;
  }

  async getCollectionAuctions(pagination: QueryPagination, collection: string): Promise<Auctions[]> {
    let hasNextPage = true;
    let after = null;

    const pageSize = pagination.size;
    const totalPages = Math.ceil(pagination.size / pageSize);

    let pagesLeft = Math.min(totalPages, 3);

    if (pagination.size > 25) {
      pagesLeft = totalPages;
    }

    const auctions: Auctions[] = [];

    while (hasNextPage && pagesLeft > 0) {
      const variables = {
        "first": pageSize,
        "after": after,
        "collection": collection,
      };

      const result: any = await this.graphQlService.getNftServiceData(collectionAuctionsQuery, variables);

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
          currentAuction.status = auction.node.status.toLowerCase();
          currentAuction.auctionType = auction.node.type;
          currentAuction.auctionId = parseInt(auction.node.id);
          currentAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
          currentAuction.marketplace = auction.node.marketplaceKey;
          currentAuction.createdAt = auction.node.creationDate;
          currentAuction.endsAt = auction.node.endDate !== 0 ? auction.endDate : undefined;
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
      const remainingAuctions = await this.getCollectionAuctions({
        ...pagination,
        size: pagination.size - auctions.length,
      }, collection);
      auctions.push(...remainingAuctions);
    }

    return auctions;
  }
}
