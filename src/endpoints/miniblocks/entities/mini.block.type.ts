import { registerEnumType } from "@nestjs/graphql";

export enum MiniBlockType {
  SmartContractResultBlock = 'SmartContractResultBlock',
  TxBlock = 'TxBlock',
}

registerEnumType(MiniBlockType, {
  name: 'MiniBlockType',
  description: 'MiniBlock Type object.',
  valuesMap: {
    SmartContractResultBlock: {
      description: 'SmartContractResultBlock.',
    },
    TxBlock: {
      description: 'TxBlock.',
    },
  },
});
