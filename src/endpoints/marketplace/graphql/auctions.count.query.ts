import { gql } from "graphql-request";

export const auctionsCount = gql`
query selectedAuction($filters: FiltersExpression) {
  auctions(
    filters: $filters
  ) {
    pageData {
      count
    }
  }
}`;
