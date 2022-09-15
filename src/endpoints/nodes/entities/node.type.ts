import { registerEnumType } from "@nestjs/graphql";

export enum NodeType {
  observer = 'observer',
  validator = 'validator'
}

registerEnumType(NodeType, {
  name: 'NodeType',
  description: 'Node Type object.',
  valuesMap: {
    observer: {
      description: 'Observer type.',
    },
    validator: {
      description: 'Validator type.',
    },

  },
});
