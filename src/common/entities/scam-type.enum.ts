import { registerEnumType } from '@nestjs/graphql';

export enum ScamType {
  none = 'none',
  potentialScam = 'potentialScam',
  scam = 'scam'
}

registerEnumType(ScamType, {
  name: 'ScamType',
});
