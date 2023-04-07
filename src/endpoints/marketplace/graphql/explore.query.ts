import { gql } from "graphql-request";

export const statsQuery = gql`
query{
  exploreStats{
    artists
    collections
    nfts
  }
}`;

export const nftsStatsQuery = gql`
query{
  exploreNftsStats{
    buyNowCount
    liveAuctionsCount
  }
}`;

export const collectionsStatsQuery = gql`
query{
  exploreCollectionsStats{
    activeLast30DaysCount
    verifiedCount
  }
}`;
