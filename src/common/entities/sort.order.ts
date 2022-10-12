import { registerEnumType } from '@nestjs/graphql';

export enum SortOrder {
  asc = 'asc',
  desc = 'desc'
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order object type.',
  valuesMap: {
    asc: {
      description: 'Ascending order.',
    },
    desc: {
      description: 'Descending order.',
    },
  },
});
