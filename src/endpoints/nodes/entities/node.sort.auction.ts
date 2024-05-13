import { registerEnumType } from "@nestjs/graphql";

export enum NodeSortAuction {
  auctionValidators = 'auctionValidators',
  droppedValidators = 'droppedValidators',
  qualifiedAuctionValidators = 'qualifiedAuctionValidators',
  qualifiedStake = 'qualifiedStake',
  dangerZoneValidators = 'dangerZoneValidators',
}

registerEnumType(NodeSortAuction, {
  name: 'NodeSortAuction',
  description: 'Node Sort Auction object.',
  valuesMap: {
    auctionValidators: {
      description: 'Auction Validators.',
    },
    droppedValidators: {
      description: 'Dropped Validators.',
    },
    qualifiedAuctionValidators: {
      description: 'Qualified Auction Validators.',
    },
    qualifiedStake: {
      description: 'Node qualified stake.',
    },
    dangerZoneValidators: {
      description: 'Danger Zone Validators.',
    },
  },
});
