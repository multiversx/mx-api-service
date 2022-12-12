import { Test } from "@nestjs/testing";

import { randomInt } from "crypto";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountDetailedResolver } from "src/graphql/entities/account.detailed/account.detailed.resolver";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountServiceMock } from "src/test/unit/graphql/mocks/account.service.mock";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionServiceMock } from "src/test/unit/graphql/mocks/collection.service.mock";
import { GetNftCollectionsAccountInput, GetNftsAccountInput } from "src/graphql/entities/account.detailed/account.detailed.input";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftServiceMock } from "src/test/unit/graphql/mocks/nft.service.mock";
import { NftQueryOptions } from "src/endpoints/nfts/entities/nft.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";

describe(AccountDetailedResolver, () => {

  const AccountServiceMockProvider = {
    provide: AccountService,
    useClass: AccountServiceMock,
  };

  const CollectionServiceMockProvider = {
    provide: CollectionService,
    useClass: CollectionServiceMock,
  };

  const NftServiceMockProvider = {
    provide: NftService,
    useClass: NftServiceMock,
  };

  let accountDetailedResolver: AccountDetailedResolver;

  let accountServiceMock: AccountService;
  let collectionServiceMock: CollectionService;
  let nftServiceMock: NftService;

  // @ts-ignore
  const parent: AccountDetailed = AccountServiceMock.accounts.at(0);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccountDetailedResolver,

        AccountServiceMockProvider,
        CollectionServiceMockProvider,
        NftServiceMockProvider,
      ],
    }).compile();

    accountDetailedResolver = module.get<AccountDetailedResolver>(AccountDetailedResolver);

    nftServiceMock = module.get<NftService>(NftService);
    collectionServiceMock = module.get<CollectionService>(CollectionService);
    accountServiceMock = module.get<AccountService>(AccountService);
  });

  it("should be defined", () => {
    expect(accountDetailedResolver).toBeDefined();
  });

  it("get account detailed transaction count should return count", async () => {
    const expectedCount: number = randomInt(3);

    jest.spyOn(accountServiceMock, "getAccountTxCount").mockImplementation(() => Promise.resolve(expectedCount));

    const actualCount: number = await accountDetailedResolver.getAccountDetailedTransactionCount(parent);

    expect(actualCount).toEqual(expectedCount);

    expect(accountServiceMock.getAccountTxCount).toHaveBeenCalledWith(parent.address);
  });

  it("get account detailed smart contract count should return count", async () => {
    const expectedCount: number = randomInt(3);

    jest.spyOn(accountServiceMock, "getAccountScResults").mockImplementation(() => Promise.resolve(expectedCount));

    const actualCount: number = await accountDetailedResolver.getAccountDetailedSmartContractCount(parent);

    expect(actualCount).toEqual(expectedCount);

    expect(accountServiceMock.getAccountScResults).toHaveBeenCalledWith(parent.address);
  });

  it("get account detailed NFT collections with non-existing account should return null", async () => {
    const input: GetNftCollectionsAccountInput = new GetNftCollectionsAccountInput();

    const expectedCollections = null;

    await assertGetAccountDetailedNftCollections(new AccountDetailed({ address: "" }), input, expectedCollections);
  });

  it("get account detailed NFT collections with existing account and default input should return collection", async () => {
    CollectionServiceMock.generateCollections(parent.address);

    const input: GetNftCollectionsAccountInput = new GetNftCollectionsAccountInput();

    const expectedCollections: NftCollectionAccount[] = CollectionServiceMock.collections[parent.address].slice(input.from, input.size);

    await assertGetAccountDetailedNftCollections(parent, input, expectedCollections);
  });

  it("get account detailed NFT collections with existing account and user input should return collection", async () => {
    CollectionServiceMock.generateCollections(parent.address);

    const input: GetNftCollectionsAccountInput = new GetNftCollectionsAccountInput({
      from: randomInt(3),
      size: randomInt(3),
    });

    const expectedCollections: NftCollectionAccount[] = CollectionServiceMock.collections[parent.address].slice(input.from, input.size);

    await assertGetAccountDetailedNftCollections(parent, input, expectedCollections);
  });

  it("get account detailed NFTs with non-existing account should return null", async () => {
    const input: GetNftsAccountInput = new GetNftsAccountInput();

    const expectedNfts = null;

    await assertGetAccountDetailedNfts(new AccountDetailed({ address: "" }), input, expectedNfts);
  });

  it("get account detailed NFTs with existing account and default input should return NFTs", async () => {
    NftServiceMock.generateNfts(parent.address);

    const input: GetNftsAccountInput = new GetNftsAccountInput();

    const expectedNfts: NftAccount[] = NftServiceMock.nfts[parent.address].slice(input.from, input.size);

    await assertGetAccountDetailedNfts(parent, input, expectedNfts);
  });

  it("get account detailed NFTs with existing account and user input should return NFTs", async () => {
    NftServiceMock.generateNfts(parent.address);

    const input: GetNftsAccountInput = new GetNftsAccountInput({
      from: randomInt(3),
      size: randomInt(3),
    });

    const expectedNfts: NftAccount[] = NftServiceMock.nfts[parent.address].slice(input.from, input.size);

    await assertGetAccountDetailedNfts(parent, input, expectedNfts);
  });

  async function assertGetAccountDetailedNftCollections(account: AccountDetailed, input: GetNftCollectionsAccountInput, expectedCollections: NftCollectionAccount[] | null) {
    jest.spyOn(collectionServiceMock, "getCollectionsForAddress");

    const actualCollection: NftCollectionAccount[] = await accountDetailedResolver.getAccountDetailedNftCollections(input, account);

    expect(actualCollection).toEqual(expectedCollections);

    expect(collectionServiceMock.getCollectionsForAddress).toHaveBeenCalledWith(
      account.address,
      new CollectionFilter({
        search: input.search,
        type: input.type,
      }),
      new QueryPagination({
        from: input.from,
        size: input.size,
      })
    );
  }

  async function assertGetAccountDetailedNfts(account: AccountDetailed, input: GetNftsAccountInput, expectedNfts: NftAccount[] | null) {
    jest.spyOn(nftServiceMock, "getNftsForAddress");

    const nfts: NftAccount[] = await accountDetailedResolver.getAccountDetailedNfts(input, account);

    expect(nfts).toEqual(expectedNfts);

    expect(nftServiceMock.getNftsForAddress).toHaveBeenCalledWith(
      account.address,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      new NftFilter({
        search: input.search,
        identifiers: input.identifiers,
        type: input.type,
        name: input.name,
        collections: input.collections,
        tags: input.tags,
        creator: input.creator,
        hasUris: input.hasUris,
        includeFlagged: input.includeFlagged,
      }),
      undefined,
      new NftQueryOptions({
        withSupply: input.withSupply,
      }),
      input.source
    );
  }
});
