import { gql } from "graphql-request";

export const auctionsQuery = gql`
query($first: Int){
  auctions(pagination:{
    first: $first,
  },
  grouping:{
    groupBy: IDENTIFIER
  },
  filters:{
    operator: AND,
    filters:[
      {
        field: "status",
        op: EQ
        values: ["Running"]
      }
    ]
  }
  ){
    edges{
      node{
        identifier
        collection
        nonce
        id
        marketplaceAuctionId
        marketplaceKey
        minBid{
          amount
          token
        }
        maxBid{
          amount
          token
        }
        creationDate
        ownerAddress
      }
    }
  }
}`;
