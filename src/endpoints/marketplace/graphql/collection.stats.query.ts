import { gql } from "graphql-request";

export const collectionStatsQuery = gql`
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
