import { gql } from "graphql-request";

export const filteredPairsQuery = (includeFarms: boolean = false) => {
  const farmFields = includeFarms ? `
        hasFarms
        hasDualFarms` : '';

  return gql`
        query filteredPairs($pagination: ConnectionArgs!, $filters: PairsFilter!) {
          filteredPairs(pagination: $pagination, filters: $filters) {
            edges {
              cursor
              node {
                address
                liquidityPoolToken {
                  identifier
                  name
                  __typename
                }
                liquidityPoolTokenPriceUSD
                firstToken {
                  name
                  identifier
                  previous24hPrice
                  __typename
                }
                secondToken {
                  name
                  identifier
                  previous24hPrice
                  __typename
                }
                firstTokenPriceUSD
                secondTokenPriceUSD
                state
                type
                lockedValueUSD
                volumeUSD24h
                tradesCount
                tradesCount24h
                deployedAt
                ${farmFields}
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
};
