import { registerEnumType } from "@nestjs/graphql";

export enum MexPairType {
  core = 'core',
  community = 'community',
  ecosystem = 'ecosystem',
  experimental = 'experimental',
  jungle = 'jungle',
  unlisted = 'unlisted',
}

registerEnumType(MexPairType, {
  name: 'MexPairType',
  description: 'MexPairType object type.',
  valuesMap: {
    core: {
      description: 'Core Type.',
    },
    community: {
      description: 'Community Type.',
    },
    ecosystem: {
      description: 'Ecosystem Type.',
    },
    experimental: {
      description: 'Experimental Type.',
    },
    jungle: {
      description: 'Jungle Type.',
    },
    unlisted: {
      description: 'Unlisted Type.',
    },
  },
});
