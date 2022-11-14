import { BadRequestException, Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountStats } from "./entities/account.stats";
import { AccountStatsFilters } from "./entities/account.stats.filter";

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
}
