import * as crypto from 'crypto-js';
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { TokenRoles } from "src/endpoints/tokens/entities/token.roles";
import { ApiUtils } from '@elrondnetwork/erdnest';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/string.extensions';

export class TokenHelpers {
  static canBool(string: string) {
    return string.split('-').pop() === 'true';
  }

  static computeNftUri(uri: string, prefix: string) {
    uri = ApiUtils.replaceUri(uri, 'https://ipfs.io/ipfs', prefix);
    uri = ApiUtils.replaceUri(uri, 'https://gateway.ipfs.io/ipfs', prefix);
    uri = ApiUtils.replaceUri(uri, 'https://gateway.pinata.cloud/ipfs', prefix);
    uri = ApiUtils.replaceUri(uri, 'https://dweb.link/ipfs', prefix);
    uri = ApiUtils.replaceUri(uri, 'ipfs:/', prefix);

    if (uri.endsWith('.ipfs.dweb.link')) {
      const id = uri.removeSuffix('.ipfs.dweb.link').removePrefix('https://');
      uri = `${prefix}/${id}`;
    }

    return uri;
  }

  static getUrlHash(url: string) {
    return crypto.SHA256(url).toString().slice(0, 8);
  }

  static getThumbnailUrlIdentifier(nftIdentifier: string, fileUrl: string) {
    const collectionIdentifier = nftIdentifier.split('-').slice(0, 2).join('-');
    const urlHash = TokenHelpers.getUrlHash(fileUrl);

    return `${collectionIdentifier}-${urlHash}`;
  }

  static needsDefaultMedia(nft: Nft): boolean {
    if (nft.type === NftType.MetaESDT) {
      return false;
    }

    if (nft.media && nft.media.length > 0) {
      return false;
    }

    return true;
  }

  static setTokenRole(tokenRoles: TokenRoles, role: string) {
    tokenRoles.roles.push(role);

    switch (role) {
      case 'ESDTRoleLocalMint':
        tokenRoles.canLocalMint = true;
        break;
      case 'ESDTRoleLocalBurn':
        tokenRoles.canLocalBurn = true;
        break;
    }
  }

  static setCollectionRole(tokenRoles: CollectionRoles, role: string) {
    tokenRoles.roles.push(role);

    switch (role) {
      case 'ESDTRoleNFTCreate':
        tokenRoles.canCreate = true;
        break;
      case 'ESDTRoleNFTBurn':
        tokenRoles.canBurn = true;
        break;
      case 'ESDTRoleNFTAddQuantity':
        tokenRoles.canAddQuantity = true;
        break;
      case 'ESDTRoleNFTAddURI':
        tokenRoles.canAddQuantity = true;
        break;
      case 'ESDTTransferRole':
        tokenRoles.canAddQuantity = true;
        break;
      case 'ESDTRoleNFTUpdateAttributes':
        tokenRoles.canAddQuantity = true;
        break;
    }
  }

  static tokenNonce(tokenID: string): number {
    const tokenNonceHex = tokenID.split('-')[2];
    return parseInt(tokenNonceHex, 16);
  }

  static getCollectionIdentifier(nftIdentifier: string): string {
    return nftIdentifier.split('-').slice(0, 2).join('-');
  }
}
