import { gql } from "graphql-request";

export const auctionsQuery = gql`
query GetAuctions($first: Int, $after: String, $before: String) {
  auctions(
    pagination: {
      first: $first,
      after: $after,
      before: $before
    },
    filters:{
      operator: AND,
      filters:[
        {
          field: "status",
          op: EQ,
          values: ["Running"]
        }
      ]
    }
    sorting: {
      direction: DESC,
      field: "creationDate"
    }
  ) {
    edges {
      cursor
      node {
        identifier
        collection
        status
        type
        nonce
        id
        marketplaceAuctionId
        marketplaceKey
        minBid {
          amount
          token
        }
        maxBid {
          amount
          token
        }
        creationDate
        ownerAddress
      }
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
  }
}
`;
