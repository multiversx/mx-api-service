import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDeferred } from 'src/endpoints/accounts/entities/account.deferred';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';
import { AccountKey } from 'src/endpoints/accounts/entities/account.key';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';
import { NftElasticAccount } from 'src/endpoints/tokens/entities/nft.elastic.account';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { mergeObjects } from 'src/helpers/helpers';
import { PublicAppModule } from 'src/public.app.module';
import request from 'supertest';

// function statusExpectation200(status: any){
//   expect(status).toBe(201);
// }

// function listLengthExpectation(expected: number, array:any)
// {
//   expect(array).toHaveLength(expected);
// }

describe('Accounts', () => {
  let app: INestApplication;
  let accountAddress: string;
  let accountTokenIdentifier: string;
  let accountNftIdentifier: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    })
      .compile();
    
    app = await moduleRef.createNestApplication();
    await app.init();
    await app.listen(8085);
  });

  it(`/GET list of accounts`, () => {
    return request(app.getHttpServer())
    .get('/accounts')
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(25);

      for(let account of response.body)
      {
        expect(account).toMatchObject(mergeObjects(new Account, account));

        accountAddress = account.address;
      }

          
    })
  });

  it(`/GET specific account`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mergeObjects(new AccountDetailed(), response.body));
          
    })
  });

  it(`/GET account deferred`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/deferred`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mergeObjects(new AccountDeferred(), response.body));
          
    })
  });

  it(`/GET account tokens`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/tokens`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      
      for(let token of response.body)
      {
        expect(token).toMatchObject(mergeObjects(new TokenWithBalance(), token));
        accountTokenIdentifier = token.token;
      }
          
    })
  });

  it(`/GET account specific token`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/tokens/${accountTokenIdentifier}`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mergeObjects(new TokenWithBalance(), response.body));
   
    })
  });

  it(`/GET account nfts`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/nfts`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      
      for(let nft of response.body)
      {
        expect(nft).toMatchObject(mergeObjects(new NftElasticAccount(), nft));
        accountNftIdentifier = nft.identifier;
      }
          
    })
  });

  it(`/GET account specific nft`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/nfts/${accountNftIdentifier}`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mergeObjects(new NftElasticAccount(), response.body));
       
    })
  });

  it(`/GET account stake`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/stake`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      // expect(response.body).toMatchObject(mergeObjects(new(), response.body));
       
    })
  });

  it(`/GET account delegation`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/delegation-legacy`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(mergeObjects(new AccountDelegationLegacy(), response.body));
       
    })
  });

  it(`/GET account keys`, () => {
    return request(app.getHttpServer())
    .get(`/accounts/${accountAddress}/keys`)
    .expect((response: request.Response) => {

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);

       for(let key of response.body)
      {
        expect(key).toMatchObject(mergeObjects(new AccountKey(), key));
        
      }
       
    })
  });

  afterAll(async () => {
    await app.close();
  });
});