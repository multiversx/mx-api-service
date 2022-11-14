import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountStats } from "./entities/account.stats";
import { AccountStatsFilters } from "./entities/account.stats.filter";
import { CollectionStats } from "./entities/collection.stats";
import { CollectionStatsFilters } from "./entities/collection.stats.filter";
import { ExploreCollectionsStats } from "./entities/explore.collections.stats";
import { ExploreNftsStats } from "./entities/explore.nfts.stats";

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
}
