import { INestApplication } from "@nestjs/common";
import { mockCollectionService, mockNftService, mockTransactionService } from "./services.mock/collection.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { CollectionController } from "src/endpoints/collections/collection.controller";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { ConfigModule } from "@nestjs/config";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { SortCollections } from "src/endpoints/collections/entities/sort.collections";
import { SortOrder } from "src/common/entities/sort.order";
import request = require('supertest');

describe('CollectionController', () => {
  let app: INestApplication;
  const path = '/collections';

  const collectionServiceMocks = mockCollectionService();
  const nftServiceMocks = mockNftService();
  const transactionServiceMocks = mockTransactionService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CollectionController],
      imports: [
        CollectionModule,
        NftModule,
        TransactionModule,
        ConfigModule.forRoot({}),
      ],
    })
      .overrideProvider(CollectionService).useValue(collectionServiceMocks)
      .overrideProvider(NftService).useValue(nftServiceMocks)
      .overrideProvider(TransactionService).useValue(transactionServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /collections', () => {
    it('should return an array of collections', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({})
      );
    });


    it('should return an array of collections with search filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ search })
      );
    });

    it('should return an array of collections with identifiers filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const identifiers = ['TEST-5409d3', 'TEST-57a352'];

      await request(app.getHttpServer())
        .get(`${path}?identifiers=${identifiers.join(',')}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ identifiers })
      );
    });

    it('should return an array of collections with type filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ type })
      );
    });


    it('should return an array of collections with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ canCreate })
      );
    });

    it('should return an array of collections with before filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ before })
      );
    });

    it('should return an array of collections with after filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ after })
      );
    });

    it('should return an array of collections with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });

    it('should return an array of collections with sort filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const sort = SortCollections.timestamp;

      await request(app.getHttpServer())
        .get(`${path}?sort=${sort}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ sort })
      );
    });


    it('should return an array of collections with order filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const order = SortOrder.desc;

      await request(app.getHttpServer())
        .get(`${path}?order=${order}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ order })
      );
    });
  });

  describe('GET /collections/count', () => {
    it('should return total collections count', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5000);
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5000);
        });

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({})
      );
    });

    it('should return total collection count with search filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}/count?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ search })
      );
    });

    it('should return total collection count with type filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2500);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}/count?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ type })
      );
    });

    it('should return total collection count with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canCreate })
      );
    });

    it('should return total collection count with before filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(20);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/count?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ before })
      );
    });

    it('should return total collection count with after filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/count?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ after })
      );
    });

    it('should return total collection count with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });
  });

  describe('GET /collections/c', () => {
    it('should return total collections count', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5000);
      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5000);
        });

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({})
      );
    });

    it('should return total collection count with search filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}/c?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ search })
      );
    });

    it('should return total collection count with type filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2500);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}/c?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ type })
      );
    });

    it('should return total collection count with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canCreate })
      );
    });

    it('should return total collection count with before filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(20);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/c?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ before })
      );
    });

    it('should return total collection count with after filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/c?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ after })
      );
    });

    it('should return total collection count with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });
  });
});

function createCollectionFilter(options: CollectionFilter = {}) {
  return new CollectionFilter({
    search: options.search,
    type: options.type,
    identifiers: options.identifiers,
    canCreate: options.canCreate,
    before: options.before,
    after: options.after,
    canBurn: options.canBurn,
    canAddQuantity: options.canAddQuantity,
    canUpdateAttributes: options.canUpdateAttributes,
    canAddUri: options.canAddUri,
    canTransferRole: options.canTransferRole,
    excludeMetaESDT: options.excludeMetaESDT,
    sort: options.sort,
    order: options.order,
  });
}
