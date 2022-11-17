import { gql } from "graphql-request";

export const accountStatsQuery = gql`
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
