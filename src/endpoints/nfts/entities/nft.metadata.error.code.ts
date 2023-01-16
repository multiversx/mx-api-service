import { registerEnumType } from "@nestjs/graphql";

export enum NftMetadataErrorCode {
  ipfsError = 'ipfs_error',
  notFound = 'not_found',
  timeout = 'timeout',
  unknownError = 'unknown_error',
  invalidContentType = 'invalid_content_type',
  jsonParseError = 'json_parse_error',
  emptyMetadata = 'empty_metadata',
}

registerEnumType(NftMetadataErrorCode, {
  name: 'NftMetadataErrorCode',
  description: 'NFT Metadata error code',
  valuesMap: {
    ipfsError: {
      description: 'IPFS error',
    },
    notFound: {
      description: 'IPFS link does not have any underlying resource',
    },
    timeout: {
      description: 'IPFS request timeout',
    },
    unknownError: {
      description: 'Unknown error',
    },
    invalidContentType: {
      description: 'Invalid contentm type (should be application/json)',
    },
    emptyMetadata: {
      description: 'Metadata is empty',
    },
  },
});
