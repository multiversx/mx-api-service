import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountStats } from "./entities/account.stats";
import { AccountStatsFilters } from "./entities/account.stats.filter";
import { Auction } from "./entities/auction";
import { StatusAuction } from "./entities/auction.state.enum";
import { CollectionStats } from "./entities/collection.stats";
import { CollectionStatsFilters } from "./entities/collection.stats.filter";
import { ExploreCollectionsStats } from "./entities/explore.collections.stats";
import { ExploreNftsStats } from "./entities/explore.nfts.stats";
import { ExploreStats } from "./entities/explore.stats";

@Injectable()
export class NftMarketplaceService {
  constructor(
    private readonly graphQlService: GraphQlService,
  ) { }

  async getAccountStats(filters: AccountStatsFilters): Promise<AccountStats> {
    const query = gql`
    query($filters: AccountStatsFilter!){
      accountStats(filters: $filters){
        address
        auctions
        biddingBalance
        claimable
        collected
        collections
        creations
        likes
        marketplaceKey
        orders
      }
    }`;

    const variables = { filters };
    const result: any = await this.graphQlService.getDataFromMarketPlace(query, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch accountsStats data from Nft Marketplace');
    }
    return {
      address: result.accountStats.address,
      auctions: result.accountStats.auctions,
      claimable: result.accountStats.claimable,
      collected: result.accountStats.collected,
      collections: result.accountStats.collections,
      creations: result.accountStats.creations,
      likes: result.accountStats.likes,
      marketplaceKey: result.accountStats.marketplaceKey,
      orders: result.accountStats.orders,
    };
  }

  async getCollectionStats(filters: CollectionStatsFilters): Promise<CollectionStats> {
    const query = gql`
    query($filters: CollectionStatsFilter!){
      collectionStats(filters: $filters){
        identifier
        activeAuctions
        auctionsEnded
        items
        maxPrice
        maxPrice
        minPrice
        saleAverage
        volumeTraded
      }
    }`;

    const variables = { filters };
    const result: any = await this.graphQlService.getDataFromMarketPlace(query, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch collectionStats data from Nft Marketplace');
    }

    return {
      identifier: result.collectionStats.identifier,
      activeAuctions: result.collectionStats.activeAuctions,
      auctionsEnded: result.collectionStats.auctionsEnded,
      maxPrice: result.collectionStats.maxPrice,
      minPrice: result.collectionStats.minPrice,
      saleAverage: result.collectionStats.saleAverage,
      volumeTraded: result.collectionStats.volumeTraded,
      items: result.collectionStats.items,
    };
  }

  async getExploreNftsStats(): Promise<ExploreNftsStats> {
    const query = gql`
    query{
      exploreNftsStats{
        buyNowCount
        liveAuctionsCount
      }
    }`;

    const result: any = await this.graphQlService.getDataFromMarketPlace(query, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreNftsStats data from Nft Marketplace');
    }

    return {
      buyNowCount: result.exploreNftsStats.buyNowCount,
      liveAuctionsCount: result.exploreNftsStats.liveAuctionsCount,
    };
  }

  async getExploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    const query = gql`
    query{
      exploreCollectionsStats{
        activeLast30DaysCount
        verifiedCount
      }
    }`;

    const result: any = await this.graphQlService.getDataFromMarketPlace(query, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreCollectionsStats data from Nft Marketplace');
    }

    return {
      verifiedCount: result.exploreCollectionsStats.verifiedCount,
      activeLast30DaysCount: result.exploreCollectionsStats.activeLast30DaysCount,
    };
  }

  async getExploreStats(): Promise<ExploreStats> {
    const query = gql`
    query{
      exploreStats{
        artists
        collections
        nfts
      }
    }`;

    const result: any = await this.graphQlService.getDataFromMarketPlace(query, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreStats data from Nft Marketplace');
    }

    return {
      artists: result.exploreStats.artists,
      collections: result.exploreStats.collections,
      nfts: result.exploreStats.nfts,
    };
  }

  async getAccountAuctions(address: string, state: StatusAuction): Promise<Auction[]> {
    const query = gql`
    query{
      auctions(filters:{
        operator: AND,
        filters:[
          {
            field: "ownerAddress",
            op: EQ
            values: ["${address}"]
          },
          {
            field: "status",
            op: EQ
            values: ["${state}"]
          }
        ]
      }){
        edges{
          node{
            id
            identifier
            collection
            status
            creationDate
            endDate
            marketplace{
              key
            }
            owner{
              address
            }
            tags
            marketplaceAuctionId
            startDate
            __typename
          }
        }
      }
    }`;

    const result: any = await this.graphQlService.getDataFromMarketPlace(query, {});
    if (!result) {
      return [];
    }

    const auctions = result.auctions.edges.map((auction: any) => {
      const accountAuction = new Auction();

      accountAuction.auctionId = auction.node.id;
      accountAuction.identifier = auction.node.identifier;
      accountAuction.collection = auction.node.collection;
      accountAuction.status = auction.node.status;
      accountAuction.creationDate = auction.node.creationDate;
      accountAuction.endDate = auction.node.endDate;
      accountAuction.marketplace = auction.node.marketplace.key;
      accountAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
      accountAuction.owner = auction.node.owner.address;
      accountAuction.tags = auction.node.tags;

      return accountAuction;
    });

    return auctions;
  }
}
