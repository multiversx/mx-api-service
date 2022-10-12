import { registerEnumType } from "@nestjs/graphql";

export enum MexFarmType {
  standard = 'standard',
  metastaking = 'metastaking',
}

registerEnumType(MexFarmType, {
  name: 'MexFarmType',
  description: 'MexFarmType object type.',
  valuesMap: {
    standard: {
      description: 'Standard type.',
    },
    metastaking: {
      description: 'Metastaking type.',
    },
  },
});
