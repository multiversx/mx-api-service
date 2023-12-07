import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDeferred } from 'src/endpoints/accounts/entities/account.deferred';
import { SmartContractResult } from 'src/endpoints/sc-results/entities/smart.contract.result';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Account Controller", () => {
  let app: INestApplication;
  const path: string = "/accounts";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/accounts', () => {
    it('should return accounts detailes for a given owner address', async () => {
      const params = new URLSearchParams({
        'ownerAddress': 'erd1yj4jlay9rrzahran7jxk89gsg9frxw6l5qyca9dqhp8c4f5e0vdsytwkvl',
      });

      const expected =
        [
          {
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat",
            balance: expect.any(String),
            nonce: 0,
            timestamp: expect.any(Number),
            shard: 4294967295,
            ownerAddress: "erd1yj4jlay9rrzahran7jxk89gsg9frxw6l5qyca9dqhp8c4f5e0vdsytwkvl",
          },
        ];

      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });

    it('should return 400 Bad Request if owner address is not correct', async () => {
      const params = new URLSearchParams({
        'ownerAddress': 'erd1yj4jlay9rrzahgsg9frxw6l5qyca9dqhp8c4f5e0vdsytwkvl',
      });
      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toEqual("Validation failed for argument 'ownerAddress' (a bech32 address is expected)");
        });
    });

    [
      {
        filter: 'sort',
        value: 'balance',
      },
      {
        filter: 'sort',
        value: 'timestamp',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return accounts details based on ${filter} with value ${value} and ordered descendent `, async () => {
          const order = 'desc';

          if (value === 'balance') {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}&${order}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                expect(Number(res.body[0].balance)).toBeGreaterThan(Number(res.body[1].balance));
              });
          } else {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}&${order}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                expect(res.body[0].timestamp).toBeGreaterThanOrEqual(res.body[1].timestamp);
              });
          }

        });
      });
    });

    [
      {
        filter: 'order',
        value: 'asc',
      },
      {
        filter: 'order',
        value: 'desc',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return accounts details based on ${filter} with value ${value} and default size`, async () => {
          const size = 25;

          if (value === 'asc') {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                for (let i = 0; i < size - 1; i++) {
                  expect(Number(res.body[i].balance)).toBeLessThanOrEqual(Number(res.body[i++].balance));
                }
              });
          } else {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                for (let i = 0; i < size - 1; i++) {
                  expect(Number(res.body[i].balance)).toBeGreaterThanOrEqual(Number(res.body[i++].balance));
                }
              });
          }
        });
      });
    });

    test.each`
size
${25}
${55}
${4}
${10000}`
      (
        `should return a list of $size items`,
        async ({ size }) => {
          const params = new URLSearchParams({
            'size': size,
          });

          await request(app.getHttpServer())
            .get(`${path}?${params}`)
            .expect(200)
            .then(res => {
              expect(res.body).toHaveLength(size);
            });
        }
      );

    [
      {
        filter: 'isSmartContract',
        value: 'true',
      },
      {
        filter: 'isSmartContract',
        value: 'false',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'true') {
          it(`should return a list of smart contracts`, async () => {

            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<SmartContractResult>);
              });
          });
        } else {
          it(`should not return a list of smart contracts`, async () => {

            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<Account>);
              });
          });
        }

      });
    });
  });

  describe('/accounts/count', () => {
    it('should return count of all accounts available on blockchain', async () => {
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(2461134);
        });
    });

    [
      {
        ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l',
        count: 1,
      },
      {
        ownerAddress: 'erd1cc2yw3reulhshp3x73q2wye0pq8f4a3xz3pt7xj79phv9wm978ssu99pvt',
        count: 22,
      },
      {
        ownerAddress: 'erd1x45vnu7shhecfz0v03qqfmy8srndch50cdx7m763p743tzlwah0sgzewlm',
        count: 4,
      },
      {
        ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6',
        count: 57,
      },
    ].forEach(({ ownerAddress, count }) => {
      describe(`ownerAddress = ${ownerAddress}`, () => {
        it(`should return count of accounts searched by owner address ${ownerAddress}`, async () => {
          const params = new URLSearchParams({
            'ownerAddress': `${ownerAddress}`,
          });

          await request(app.getHttpServer())
            .get(`${path}/count?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/accounts/{address}', () => {
    it('should return account details for a given address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqksuhk8dal6wyqje72csqma5j6ncguwj4zvdqc6xzwj';

      await request(app.getHttpServer())
        .get(`${path}/${address}`)
        .expect(200)
        .then(res => {
          expect(res.body.address).toStrictEqual(address);
          expect(res.body.balance).toBeDefined();
          expect(res.body.nonce).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.shard).toStrictEqual(2);
          expect(res.body.ownerAddress).toStrictEqual('erd1ajyez9tt0a9sra5mvm44g0rlzzg9yfytrw3twt0z8dr4wg7zmlwq7w8xv6');
          expect(res.body.assets).toBeDefined();
          expect(res.body.code).toBeDefined();
          expect(res.body.codeHash).toStrictEqual('KiHTQKSCnk9+wjZZL0jeS2vV2E3dIVxrG0CgNqoroJc=');
          expect(res.body.rootHash).toStrictEqual('at+/lZ/9vwrRPDLkwXau559k7n8qyJ0DVm8tMIgcBuU=');
          expect(res.body.txCount).toBeDefined();
          expect(res.body.scrCount).toStrictEqual(32687);
          expect(res.body.developerReward).toBeDefined();
          expect(res.body.isPayableBySmartContract).toStrictEqual(true);
          expect(res.body.isUpgradeable).toStrictEqual(true);
          expect(res.body.isReadable).toStrictEqual(true);
          expect(res.body.isGuarded).toStrictEqual(false);
          expect(res.body.isPayable).toStrictEqual(false);
          expect(res.body.deployTxHash).toStrictEqual('215e24332cc2734e499be534268a7badd13dcf82735cfc0ab571fe09d9fe0804');
          expect(res.body.deployedAt).toStrictEqual(1689340068);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqk8dal6wyqje72csqma5j6ncguwj4zvdqc6xzwj';

      await request(app.getHttpServer())
        .get(`${path}/${address}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });

    [
      {
        filter: 'withGuardianInfo',
        value: 'true',
      },
      {
        filter: 'withGuardianInfo',
        value: 'false',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'true') {
          it(`should return guardian data for a given address`, async () => {
            const address: string = 'erd1crmtrfefl0g5nnqpjawm8tf5mnj23mvh47qwkrj48lq2le4hajlsednsd8';

            await request(app.getHttpServer())
              .get(`${path}/${address}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body.activeGuardianActivationEpoch).toBeDefined();
                expect(res.body.activeGuardianAddress).toBeDefined();
                expect(res.body.activeGuardianServiceUid).toBeDefined();
                expect(res.body.isGuarded).toStrictEqual(true);
              });
          });
        } else {
          it(`should not return guardian data for a given address`, async () => {
            const address: string = 'erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3';

            await request(app.getHttpServer())
              .get(`${path}/${address}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                expect(res.body.isGuarded).toStrictEqual(false);
              });
          });
        }

      });
    });

    it('should return account details for a given address, filtered by rootHash', async () => {
      const address: string = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter: string = 'fields';
      const value: string = 'rootHash';
      const rootHash: string = '9B2w5VHA7jm3cgAsZEmBVfz7XSGDwVzwFIWau6yRFgw=';
      await request(app.getHttpServer())
        .get(`${path}/${address}?${filter}=${value}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeDefined();
          expect(res.body.rootHash).toStrictEqual(rootHash);
        });
    });
  });

  describe('/accounts/{address}/deferred', () => {
    test.each`
address
${'erd1gxphytujxd0uy9cqsduwtgfw774zgz7mqf3px9yyxqg69c8emrcqtssmgr'}
${'erd120mapml83srwq9xla3eqcqyy4m288h90xvv92jg2gm5cg4m2x09scl2y0n'}
${'erd166ezskf5kczjr89mcj79l946dgwkd4lrqt0f48ps8pmpezddm0nqe5dddx'}
${'erd1hgdyq22rw33v2e59l53x2wr0gaqy8tt32j5zvhs8zj6dlqrydykq2p7r38'}`
      (
        `should return deferred payments from legacy staking`,
        async ({ address }) => {

          await request(app.getHttpServer())
            .get(`${path}/${address}/deferred`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountDeferred>);
            });
        }
      );

  });

  describe('/accounts/{address}/verification', () => {

  });

  describe('/accounts/{address}/tokens', () => {
    it(`should return a list of all available fungible tokens for a given address, together with their balance`, async () => {
      const params = new URLSearchParams({
        'address': 'erd1lz6vlamhv849yfhp4dyk9362rga3zx24rt45vczuc4q5wsgk5vksxmq7yv',
      });
      await request(app.getHttpServer())
        .get(`${path}?${params}/tokens`)
        .expect(200)
        .then(res => {
          console.log(res.body);
          expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
        });
    });

  });

  describe('/accounts/{address}/tokens/count', () => {

  });

  describe('/accounts/{address}/tokens/{token}', () => {

  });

  afterEach(async () => {
    await app.close();
  });
});

