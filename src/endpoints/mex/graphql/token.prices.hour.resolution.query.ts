import { gql } from "graphql-request";

export const tokenPricesHourResolutionQuery = (tokenIdentifier: string) => gql`
 query tokenPricesHourResolution {
        values24h(
          series: "${tokenIdentifier}",
          metric: "priceUSD"
        ) {
          timestamp
          value
        }
      }
    `;
