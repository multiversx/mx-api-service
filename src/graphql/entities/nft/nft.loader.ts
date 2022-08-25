import { Injectable } from "@nestjs/common";
import DataLoader from "dataloader";
import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";

@Injectable()
export class NftLoader {
  constructor(
    private readonly accountService: AccountService,
    protected readonly collectionService: CollectionService
  ) { }

  public async getAccount(address: string): Promise<Array<Account>> {
    return await this.accountDataLoader.load(address);
  }

  private readonly accountDataLoader: any = new DataLoader(async addresses => {
    // @ts-ignore
    const accounts = await this.accountService.getAccountsForAddresses(addresses);

    return accounts.sorted((element) => addresses.indexOf(element.address));
  }, { cache: false });

  public async getCollection(identifier: string): Promise<Array<NftCollection | null>> {
    return await this.nftDataLoader.load(identifier);
  }

  private readonly nftDataLoader: any = new DataLoader(async identifiers => {
    // @ts-ignore
    const collections = await this.collectionService.getNftCollectionsByIds(identifiers);

    return identifiers.map((identifier) => collections.find((collection) => collection.collection === identifier));
  }, { cache: false });
}
