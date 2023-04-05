import { ElrondCachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import * as fs from 'fs';
import * as path from 'path';
import { TokenType } from "src/common/indexer/entities";
import { DataApiService } from "src/common/data-api/data-api.service";

describe('Token Service', () => {
  let tokenService: TokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: IndexerService, useValue: {
            getCollection: jest.fn(),
            getTokenCountForAddress: jest.fn(),
            getTokensForAddress: jest.fn(),
            getTokenAccounts: jest.fn(),
            getTokenAccountsCount: jest.fn(),
            getToken: jest.fn(),
            getTokensWithRolesForAddressCount: jest.fn(),
            getTokensWithRolesForAddress: jest.fn(),
            getEsdtAccountsCount: jest.fn(),
          },
        },
        {
          provide: ElrondCachingService,
          useValue:
          {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: EsdtService,
          useValue: {
            getEsdtAddressesRoles: jest.fn(),
            getTokenSupply: jest.fn(),
            getEsdtTokenProperties: jest.fn(),
            getAllFungibleTokenProperties: jest.fn(),
          },
        },
        {
          provide: EsdtAddressService,
          useValue: {
            getAllEsdtsForAddressFromGateway: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getAddressNft: jest.fn(),
            getAddressEsdt: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getIsIndexerV3FlagActive: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getTokenAssets: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            getTransactionCount: jest.fn(),
          },
        },
        {
          provide: MexTokenService,
          useValue: {
            getMexPricesRaw: jest.fn(),
          },
        },
        {
          provide: CollectionService,
          useValue: {
            applyCollectionRoles: jest.fn(),
            getNftCollections: jest.fn(),
          },
        },
        {
          provide: DataApiService,
          useValue: {
            getEsdtTokenPrice: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isToken', () => {
    it('should return true if identifier exists in getAllTokens', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      const result = await tokenService.isToken('WEGLD-bd4d79');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return false if identifier does not exist in getAllTokens', async () => {
      tokenService.getAllTokens = jest.fn().mockResolvedValue([]);

      const result = await tokenService.isToken('WEGLD-bd4d79');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token details if identifier exists in getAllTokens', async () => {
      const data = require('../../mocks/tokens.mock.json');

      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue([]);

      const result = await tokenService.getToken('WEGLD-bd4d79');
      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).toHaveBeenCalledTimes(1);
      expect(tokenService.applySupply).toHaveBeenCalledTimes(1);
      expect(tokenService.getTokenRoles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({
        identifier: 'WEGLD-bd4d79',
        type: 'FungibleESDT',
        collection: undefined,
        nonce: undefined,
        name: 'WrappedEGLD',
        ticker: 'WEGLD',
        owner: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
        minted: '',
        burnt: '',
        initialMinted: '',
        decimals: 18,
        isPaused: false,
        transactions: 5900945,
        accounts: 123942,
        canUpgrade: true,
        canMint: true,
        canBurn: true,
        canChangeOwner: true,
        canAddSpecialRoles: true,
        canPause: true,
        canFreeze: true,
        canWipe: true,
        canTransferNftCreateRole: undefined,
        price: 41.626458658528016,
        marketCap: 39400951.72791124,
        supply: '946536241555565591724502',
        circulatingSupply: '946536241555565591724502',
      }));
    });

    it('should return undefined if identifier does not exist in getAllTokens', async () => {
      tokenService.getAllTokens = jest.fn().mockResolvedValue([]);
      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('token-1234');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).not.toHaveBeenCalled();
      expect(tokenService.applySupply).not.toHaveBeenCalled();
      expect(tokenService.getTokenRoles).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined if identifier is not a valid token', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('invalid-token');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).not.toHaveBeenCalled();
      expect(tokenService.applySupply).not.toHaveBeenCalled();
      expect(tokenService.getTokenRoles).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined if getTokenRoles returns undefined for fungible tokens', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('token1');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).toHaveBeenCalledTimes(0);
      expect(tokenService.applySupply).toHaveBeenCalledTimes(0);
      expect(result).toBeUndefined();
    });
  });

  describe('getTokens', () => {
    it('should return an empty array when there are no tokens', async () => {
      const queryPagination: QueryPagination = { from: 0, size: 10 };
      const filter: TokenFilter = {};
      const getFilteredTokensMock = jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue([]);

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(getFilteredTokensMock).toHaveBeenCalledWith(filter);
      expect(result).toEqual([]);
    });

    it('should return the correct number of tokens when they exist', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      const applyTickerFromAssetsMock = jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination = new QueryPagination();
      queryPagination.size = 2;
      const filter: TokenFilter = {};

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(getFilteredTokensMock).toHaveBeenCalledWith(filter);
      expect(result.length).toEqual(2);
      expect(applyTickerFromAssetsMock).toHaveBeenCalledTimes(2);
    });

    it('should verify if assets property is defined', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const filter: TokenFilter = {};
      const queryPagination: QueryPagination = new QueryPagination();

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result.length).toEqual(25);
      expect(result[0].assets).toBeDefined();
    });

    it('should verify when includeMetaESDT is true, response body should contain MetaESDTs', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const filter: TokenFilter = new TokenFilter();
      filter.includeMetaESDT = true;
      const queryPagination: QueryPagination = new QueryPagination({ size: 30 });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toContainEqual(expect.objectContaining({ type: 'MetaESDT' }));
    });

    it('should return an array of tokens details for a specific array of identifiers', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ identifiers: ['MEX-455c57', 'WEGLD-bd4d79'] });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'MEX-455c57' }),
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific identifier', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ identifier: 'WEGLD-bd4d79' });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific search keyword', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ search: 'WEGLD' });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific name', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ search: 'WrappedEGLD' });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of tokens with ESDT type equal with Fungible', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ type: TokenType.FungibleESDT });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(25);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'FungibleESDT' }),
      ]));
    });
  });

  describe('getTokenCount', () => {
    it('should return total tokens count', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const result = await tokenService.getTokenCount(new TokenFilter());

      expect(result).toStrictEqual(25);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return total tokens count and add MetaESDT', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.includeMetaESDT = true;

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(26);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return tokens count when identifier filter is applied', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.identifier = "WEGLD-bd4d79";

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(1);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return tokens count when identifiers filter is applied', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.identifiers = ['MEX-455c57', 'WEGLD-bd4d79'];

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(2);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });
  });

  describe('getTokenCountForAddress', () => {
    it('should return the correct token count for a valid address and filter', async () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });
      const expectedCount = 10;
      const getTokenCountForAddressMock = jest.spyOn(tokenService['indexerService'], 'getTokenCountForAddress')
        .mockResolvedValue(expectedCount);

      const result = await tokenService.getTokenCountForAddress(address, filter);
      expect(result).toEqual(expectedCount);
      expect(getTokenCountForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokenCountForAddressFromElastic', () => {
    it('should return the correct token count from elastic for a valid address and filter', async () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });
      const expectedCount = 10;
      const getTokenCountForAddressMock = jest.spyOn(tokenService['indexerService'], 'getTokenCountForAddress')
        .mockResolvedValue(expectedCount);

      const result = await tokenService.getTokenCountForAddressFromElastic(address, filter);
      expect(result).toEqual(expectedCount);
      expect(getTokenCountForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokenCountForAddressFromGateway', () => {
    it('should return the correct token count for a valid address and filter', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });

      const expectedCount = 26;
      const getAllTokensForAddressMock = jest.spyOn(tokenService, 'getAllTokensForAddress').mockResolvedValue(mockTokens);

      const count = await tokenService.getTokenCountForAddressFromGateway(address, filter);

      expect(count).toEqual(expectedCount);
      expect(getAllTokensForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokensForAddress', () => {
    it('should return the correct tokens with balances for a valid address and filter', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const queryPagination = { from: 0, size: 1 };
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });

      jest.spyOn(tokenService, 'getAllTokensForAddress').mockResolvedValue(mockTokens);

      const result = await tokenService.getTokensForAddress(address, queryPagination, filter);

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          identifier: 'WEGLD-bd4d79',
        }),
      ]));
    });
  });
});
