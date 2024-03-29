import { registerEnumType } from "@nestjs/graphql";

export enum SortBlocks {
  timestamp = 'timestamp',
}

registerEnumType(SortBlocks, {
  name: 'SortBlocks',
  description: 'Sort Blocks object.',
  valuesMap: {
    timestamp: {
      description: 'timestamp.',
    },
  },
});
