import { CollectionRoles } from "src/endpoints/tokens/entities/collection.roles";
import { TokenHelpers } from "src/utils/token.helpers";

describe('TokenHelpers', () => {
  describe('setCollectionRole', () => {
    it('should set the corresponding role property for `canCreate` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTRoleNFTCreate');
      expect(collectionRoles.canCreate).toBe(true);
      expect(collectionRoles.roles.includes('ESDTRoleNFTCreate')).toBe(true);
    });

    it('should set the corresponding role property for `canBurn` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTRoleNFTBurn');
      expect(collectionRoles.canBurn).toBe(true);
      expect(collectionRoles.roles.includes('ESDTRoleNFTBurn')).toBe(true);
    });

    it('should set the corresponding role property for `canAddQuantity` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTRoleNFTAddQuantity');
      expect(collectionRoles.canAddQuantity).toBe(true);
      expect(collectionRoles.roles.includes('ESDTRoleNFTAddQuantity')).toBe(true);
    });

    it('should set the corresponding role property for `canAddUri` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTRoleNFTAddURI');
      expect(collectionRoles.canAddUri).toBe(true);
      expect(collectionRoles.roles.includes('ESDTRoleNFTAddURI')).toBe(true);
    });

    it('should set the corresponding role property for `canUpdateAttributes` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTRoleNFTUpdateAttributes');
      expect(collectionRoles.canUpdateAttributes).toBe(true);
      expect(collectionRoles.roles.includes('ESDTRoleNFTUpdateAttributes')).toBe(true);
    });

    it('should set the corresponding role property for `canTransfer` to true', () => {
      const collectionRoles: CollectionRoles = {
        roles: [],
        canCreate: false,
        canBurn: false,
        canAddQuantity: false,
        canAddUri: false,
        canUpdateAttributes: false,
        canTransfer: false,
        address: undefined,
      };

      TokenHelpers.setCollectionRole(collectionRoles, 'ESDTTransferRole');
      expect(collectionRoles.canTransfer).toBe(true);
      expect(collectionRoles.roles.includes('ESDTTransferRole')).toBe(true);
    });
  });

  describe('tokenNonce', () => {
    it('should return the token nonce as a number', () => {
      const tokenID = 'XPACHIEVE-5a0519-0b';
      const expectedNonce = parseInt('0b', 16);
      expect(TokenHelpers.tokenNonce(tokenID)).toBe(expectedNonce);
    });
  });

  describe('getCollectionIdentifier', () => {
    it('should return the collection identifier from the given NFT identifier', () => {
      const nftIdentifier = 'XPACHIEVE-5a0519-0b';
      const expectedCollectionIdentifier = 'XPACHIEVE-5a0519';
      expect(TokenHelpers.getCollectionIdentifier(nftIdentifier)).toBe(expectedCollectionIdentifier);
    });
  });
});
