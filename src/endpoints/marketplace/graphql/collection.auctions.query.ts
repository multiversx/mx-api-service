import { gql } from "graphql-request";

export const collectionAuctionsQuery = gql`
query GetAuctions($first: Int, $after: String, $before: String, $collection: [String]!) {
  auctions(
    pagination: {
      first: $first,
      after: $after,
      before: $before
    },
    filters:{
      filters:[
        {
          field: "status",
          op: EQ,
          values: ["Running"]
        },
        {
          field: "collection",
          op: EQ,
          values: $collection
        }
      ],
      operator: AND,
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
