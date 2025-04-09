import { Injectable } from "@nestjs/common";
import { TokenRoles } from "../entities/token.roles";
import { TokenType } from "src/common/indexer/entities";
import { TokenHelpers } from "src/utils/token.helpers";
import { IndexerService } from "src/common/indexer/indexer.service";
import { TokenDetailed } from "../entities/token.detailed";
import { CollectionService } from "src/endpoints/collections/collection.service";

@Injectable()
export class TokenRolesService {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly collectionService: CollectionService,
  ) { }

  async getTokenRoles(identifier: string): Promise<TokenRoles[] | undefined> {
    return await this.getTokenRolesFromElastic(identifier);
  }

  async getTokenRolesForIdentifierAndAddress(identifier: string, address: string): Promise<TokenRoles | undefined> {
    const token = await this.indexerService.getToken(identifier);

    if (!token) {
      return undefined;
    }

    if (!token.roles) {
      return undefined;
    }

    const addressRoles: TokenRoles = new TokenRoles();
    addressRoles.address = address;
    for (const role of Object.keys(token.roles)) {
      const addresses = token.roles[role].distinct();
      if (addresses.includes(address)) {
        TokenHelpers.setTokenRole(addressRoles, role);
      }
    }

    //@ts-ignore
    delete addressRoles.address;

    return addressRoles;
  }

  private async getTokenRolesFromElastic(identifier: string): Promise<TokenRoles[] | undefined> {
    const token = await this.indexerService.getToken(identifier);
    if (!token) {
      return undefined;
    }

    if (!token.roles) {
      return [];
    }

    const roles: TokenRoles[] = [];
    for (const role of Object.keys(token.roles)) {
      const addresses = token.roles[role].distinct();

      for (const address of addresses) {
        let addressRole = roles.find((addressRole) => addressRole.address === address);
        if (!addressRole) {
          addressRole = new TokenRoles();
          addressRole.address = address;
          roles.push(addressRole);
        }

        TokenHelpers.setTokenRole(addressRole, role);
      }
    }

    return roles;
  }

  async applyTokenRoles(token: TokenDetailed): Promise<void> {
    if (token.type === TokenType.FungibleESDT) {
      token.roles = await this.getTokenRoles(token.identifier);
    } else if (token.type === TokenType.MetaESDT) {
      const elasticCollection = await this.indexerService.getCollection(token.identifier);
      if (elasticCollection) {
        await this.collectionService.applyCollectionRoles(token, elasticCollection);
      }
    }
  }
}
