import { gql } from "graphql-request";

// Base settings query without pairs to avoid heavy responses per page.
export const settingsBaseQuery = gql`
query {
  proxy {
    address
    lockedAssetTokens {
      collection
    }
  }
  farms {
    ... on FarmModelV1_2 {
      state
      address
    }
    ... on FarmModelV1_3 {
      state
      address
    }
    ... on FarmModelV2 {
      state
      address
    }
  }
  wrappingInfo {
    address
    wrappedToken {
      identifier
    }
  }
  distribution {
    address
  }
  lockedAssetFactory {
    address
  }
  stakingFarms {
    state
    address
  }
  stakingProxies {
    address
  }
  factory {
    address
  }
  simpleLockEnergy {
    baseAssetToken {
      identifier
    }
  }
}
`;

// Minimal paginated pairs query for addresses only.
export const paginatedPairsAddressesQuery = gql`
  query paginatedPairs($pagination: ConnectionArgs!, $filters: PairsFilter!) {
    filteredPairs(pagination: $pagination, filters: $filters) {
      edges {
        cursor
        node {
          address
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;
