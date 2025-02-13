import { gql } from "graphql-request";

export const farmsQuery = gql`
      query {
        farms {
          ... on FarmModelV1_2 {
            version
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
          ... on FarmModelV1_3 {
            version
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
          ... on FarmModelV2 {
            version
            address
            farmToken {
              collection
              name
              ticker
              __typename
            }
            farmingToken {
              name
              identifier
              decimals
              __typename
            }
            farmedToken {
              name
              identifier
              decimals
              __typename
            }
            farmTokenPriceUSD
            farmingTokenPriceUSD
            farmedTokenPriceUSD
          }
        }
        stakingFarms {
          address
          farmingToken {
            name
            identifier
            decimals
              __typename
          }
          farmToken {
            name
            collection
            decimals
              __typename
          }
        }
      }
    `;
