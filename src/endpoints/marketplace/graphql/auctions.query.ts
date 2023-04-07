import { gql } from "graphql-request";
export const auctionsQuery = gql`
query GetAuctions($first: Int, $after: String, $before: String, $currentTimestamp: String) {
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
        {
          field: "startDate",
          op: LE,
          values: [$currentTimestamp]
        }
      ]
    }
    sorting: {
      direction: DESC,
      field: "creationDate"
    }
    grouping:{
      groupBy: IDENTIFIER
    },
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
