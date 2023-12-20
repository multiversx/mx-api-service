import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDeferred } from 'src/endpoints/accounts/entities/account.deferred';
import { AccountEsdtHistory } from 'src/endpoints/accounts/entities/account.esdt.history';
import { AccountHistory } from 'src/endpoints/accounts/entities/account.history';
import { AccountKey } from 'src/endpoints/accounts/entities/account.key';
import { ContractUpgrades } from 'src/endpoints/accounts/entities/contract.upgrades';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';
import { NftCollectionWithRoles } from 'src/endpoints/collections/entities/nft.collection.with.roles';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';
import { SmartContractResult } from 'src/endpoints/sc-results/entities/smart.contract.result';
import { AccountDelegation } from 'src/endpoints/stake/entities/account.delegation';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { TokenWithRoles } from 'src/endpoints/tokens/entities/token.with.roles';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
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
                for (let i = 0; i < res.body.length - 1; i++) {
                  expect(Number(res.body[i].balance)).toBeGreaterThanOrEqual(Number(res.body[i++].balance));
                }
              });
          } else {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}&${order}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                for (let i = 0; i < res.body.length - 1; i++) {
                  expect(res.body[i].timestamp).toBeGreaterThanOrEqual(res.body[i++].timestamp);
                }
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
          if (value === 'asc') {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                for (let i = 0; i < res.body.length - 1; i++) {
                  expect(Number(res.body[i].balance)).toBeLessThanOrEqual(Number(res.body[i++].balance));
                }
              });
          } else {
            await request(app.getHttpServer())
              .get(`${path}?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeDefined();
                for (let i = 0; i < res.body.length - 1; i++) {
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

  describe('/accounts/c', () => {
    it('should return alternative count of all accounts available on blockchain', async () => {
      await request(app.getHttpServer())
        .get(`${path}/c`)
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
        it(`should return alternative count of accounts searched by owner address ${ownerAddress}`, async () => {
          const params = new URLSearchParams({
            'ownerAddress': `${ownerAddress}`,
          });
          await request(app.getHttpServer())
            .get(`${path}/c?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
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

    it('should return 400 Bad Request for an invalid owner address', async () => {
      const ownerAddress: string = 'erd1qqqqqqqk2csqma5j6ncguwj4zvdqc6xzwj';
      await request(app.getHttpServer())
        .get(`${path}/count?ownerAddress=${ownerAddress}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
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
          expect(res.body.rootHash).toBeDefined();
          expect(res.body.txCount).toBeDefined();
          expect(res.body.scrCount).toBeDefined();
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
    it('should return deferred payments from legacy staking for a given address', async () => {
      const address: string = 'erd1gdcezn4shuc67m84vqwujeqsae3k2mx2tcq97edq88r7tncyyuxswhhkkp';
      await request(app.getHttpServer())
        .get(`${path}/${address}/deferred`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<AccountDeferred>);
        });
    });

    it('should return 400 Bad Request if address is not correct', async () => {
      const address: string = 'erd1gd84vqwujeqsae3k2mx2tcq97edq88r7tncyyuxswhhkkp';
      await request(app.getHttpServer())
        .get(`${path}/${address}/deferred`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/verification', () => {
    it('should return contract verification details for a given address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqjsnxqprks7qxfwkcg2m2v9hxkrchgm9akp2segrswt';
      await request(app.getHttpServer())
        .get(`${path}/${address}/verification`)
        .expect(200)
        .then(res => {
          expect(res.body.codeHash).toBeDefined();
          expect(res.body.source).toBeDefined();
          expect(res.body.status).toStrictEqual("success");
          expect(res.body.ipfsFileHash).toBeDefined();
        });
    });

    it('should throw exception "Account verification not found"', async () => {
      const address: string = 'erd1lz6vlamhv849yfhp4dyk9362rga3zx24rt45vczuc4q5wsgk5vksxmq7yv';
      await request(app.getHttpServer())
        .get(`${path}/${address}/verification`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual("Account verification not found");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqk8dal6wje72csqma5j6ncguwj4zvdqc6xzwj';
      await request(app.getHttpServer())
        .get(`${path}/${address}/verification`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/tokens', () => {
    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqk8dal6wje72csqma5j6ncguwj4zvdqc6xzwj';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it(`should return a list of all available fungible tokens for a given address, together with their balance`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
        });
    });

    [
      {
        filter: 'includeMetaESDT',
        value: 'true',
      },
      {
        filter: 'includeMetaESDT',
        value: 'false',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'true') {
          it(`should return a list of all available Fungible / MetaESDT tokens for a given address`, async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type === 'FungibleESDT' || res.body[i].type === 'MetaESDT').toBe(true);
                }
              });
          });
        } else if (value === 'false') {
          it(`should return a list of all available Fungible tokens for a given address`, async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('FungibleESDT');
                }
              });
          });
        }
      });
    });

    [
      {
        filter: 'type',
        value: 'FungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filters ${filter} and includeMetaESDT are applied`, () => {
        if (value === 'FungibleESDT') {
          it(`should return a list of all available Fungible tokens for a given address`, async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens?includeMetaESDT=true&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('FungibleESDT');
                }
              });
          });
        } else if (value === 'MetaESDT') {
          it(`should return a list of all available MetaESDT tokens for a given address`, async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens?includeMetaESDT=true&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('MetaESDT');
                }
              });
          });
          it(`should return empty array`, async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens?includeMetaESDT=false&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
                expect(res.body).toEqual([]);
              });
          });
        }
      });
    });

    [
      {
        size: 3,
      },
      {
        size: 10,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} available fungible tokens for a given address, together with their balance`, async () => {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          await request(app.getHttpServer())
            .get(`${path}/${address}/tokens?size=${size}&includeMetaESDT=true`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<TokenWithBalance>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    [
      {
        filter: 'search',
        value: 'AERO-458bbf',
      },
      {
        filter: 'name',
        value: 'Aerovek',
      },
      {
        filter: 'identifier',
        value: 'AERO-458bbf',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return a list of all available fungible tokens for a given address based on value ${value}`, async () => {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          await request(app.getHttpServer())
            .get(`${path}/${address}/tokens?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body[0].identifier).toStrictEqual('AERO-458bbf');
              expect(res.body[0].owner).toStrictEqual('erd1kyunz8z7393k6f0mfa5vhfgzjnvm4nk7p5gjzgfnhtyu92q3tqas70hpv5');
              expect(res.body[0].assets).toBeDefined();
            });
        });
      });
    });

    it(`should return a list of all available fungible tokens for a given address, when filter identifiers is applied`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const params = new URLSearchParams({
        'identifiers': 'AERO-458bbf,BLK-62896c',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeDefined();
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].identifier === 'AERO-458bbf' || res.body[i].identifier === 'BLK-62896c').toBe(true);
          }
        });
    });
  });

  describe('/accounts/{address}/tokens/count', () => {
    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqk8dal6wje72csqma5j6ncguwj4zvdqc6xzwj';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        address: 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p',
        count: 13,
      },
      {
        address: 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets',
        count: 15,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return the total number of tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
          const params = new URLSearchParams({
            'includeMetaESDT': 'true',
          });
          await request(app.getHttpServer())
            .get(`${path}/${address}/tokens/count?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'FungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'FungibleESDT') {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          it(`should return the total number of FungibleESDT tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(12);
              });
          });
        } else if (value === 'MetaESDT') {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          it(`should return the total number of MetaESDT tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(1);
              });
          });
          it(`should return the total number of MetaESDT tokens for a given address ${address}, when filter includeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toStrictEqual(0);
              });
          });
        }
      });
    });

    [
      {
        filter: 'search',
        value: 'AERO-458bbf',
        count: 1,
      },
      {
        filter: 'name',
        value: 'Aerovek',
        count: 1,
      },
      {
        filter: 'identifier',
        value: 'AERO-458bbf',
        count: 1,
      },
    ].forEach(({ filter, value, count }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return he total number of tokens for a given address based on value ${value}`, async () => {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          await request(app.getHttpServer())
            .get(`${path}/${address}/tokens/count?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it(`should return the total number of tokens for a given address, when filter identifiers is applied`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const params = new URLSearchParams({
        'identifiers': 'AERO-458bbf,BLK-62896c',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/accounts/{address}/tokens/c', () => {
    [
      {
        address: 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p',
        count: 13,
      },
      {
        address: 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets',
        count: 15,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return alternative count of tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
          const params = new URLSearchParams({
            'includeMetaESDT': 'true',
          });
          await request(app.getHttpServer())
            .get(`${path}/${address}/tokens/c?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'FungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'FungibleESDT') {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          it(`should return alternative count of FungibleESDT tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(12);
              });
          });
        } else if (value === 'MetaESDT') {
          const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
          it(`should return alternative count of MetaESDT tokens for a given address ${address}, when filter includeMetaESDT is true`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(1);
              });
          });
          it(`should return alternative count of MetaESDT tokens for a given address ${address}, when filter includeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'includeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/tokens/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toStrictEqual(0);
              });
          });
        }
      });
    });
  });

  describe('/accounts/{address}/tokens/{token}', () => {
    it('should return 400 Bad Request for an invalid token', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const token: string = 'AER';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/${token}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'token': Invalid token / NFT identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const token: string = 'AERO-458bbf';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/${token}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it('should return 404 token for given account not found', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const token: string = 'HSEGLD-c13a4e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/${token}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual("Token for given account not found");
        });
    });

    it('should return details about a specific Fungible token from a given address', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const token: string = 'AERO-458bbf';
      await request(app.getHttpServer())
        .get(`${path}/${address}/tokens/${token}`)
        .expect(200)
        .then(res => {
          expect(res.body.type).toStrictEqual("FungibleESDT");
          expect(res.body.identifier).toStrictEqual(token);
          expect(res.body.name).toStrictEqual("Aerovek");
          expect(res.body.ticker).toStrictEqual("AERO");
          expect(res.body.owner).toStrictEqual("erd1kyunz8z7393k6f0mfa5vhfgzjnvm4nk7p5gjzgfnhtyu92q3tqas70hpv5");
          expect(res.body.minted).toBeDefined();
          expect(res.body.burnt).toBeDefined();
          expect(res.body.initialMinted).toBeDefined();
          expect(res.body.decimals).toBeDefined();
          expect(res.body.isPaused).toBeDefined();
          expect(res.body.assets).toBeDefined();
          expect(res.body.transactions).toBeDefined();
          expect(res.body.accounts).toBeDefined();
          expect(res.body.canUpgrade).toStrictEqual(false);
          expect(res.body.canMint).toStrictEqual(false);
          expect(res.body.canBurn).toStrictEqual(true);
          expect(res.body.canChangeOwner).toStrictEqual(true);
          expect(res.body.canAddSpecialRoles).toStrictEqual(false);
          expect(res.body.canPause).toStrictEqual(false);
          expect(res.body.canFreeze).toStrictEqual(false);
          expect(res.body.canWipe).toStrictEqual(false);
          expect(res.body.price).toBeDefined();
          expect(res.body.marketCap).toBeDefined();
          expect(res.body.supply).toBeDefined();
          expect(res.body.circulatingSupply).toBeDefined();
          expect(res.body.balance).toBeDefined();
          expect(res.body.valueUsd).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('/accounts/{address}/roles/collections', () => {
    it(`should return a list of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftCollectionWithRoles>);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        filter: 'search',
        value: 'BONPASS-31488b',
      },
      {
        filter: 'owner',
        value: 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, based on value ${value}`, async () => {
          const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
          await request(app.getHttpServer())
            .get(`${path}/${address}/roles/collections?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeDefined();
              expect(res.body[0].collection).toStrictEqual('BONPASS-31488b');
              expect(res.body[0].owner).toStrictEqual('erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz');
            });
        });
      });
    });

    [
      {
        size: 3,
      },
      {
        size: 5,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
          const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
          await request(app.getHttpServer())
            .get(`${path}/${address}/roles/collections?size=${size}&excludeMetaESDT=false`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<NftCollectionWithRoles>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'NonFungibleESDT',
      },
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'NonFungibleESDT') {
          it(`should return a list of all available NonFungibleESDT collections for a given address`, async () => {
            const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
            await request(app.getHttpServer())
              .get(`${path}/${address}/roles/collections?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftCollectionWithRoles>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('NonFungibleESDT');
                }
              });
          });
        } else if (value === 'SemiFungibleESDT') {
          it(`should return a list of all available SemiFungibleESDT collections for a given address`, async () => {
            const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
            await request(app.getHttpServer())
              .get(`${path}/${address}/roles/collections?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftCollectionWithRoles>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('SemiFungibleESDT');
                }
              });
          });
        }
      });
    });

    it(`should return NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, when filters canCreate, canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole, excludeMetaESDT are applied`, async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      const params = new URLSearchParams({
        'canCreate': 'true',
        'canBurn': 'true',
        'canAddQuantity': 'true',
        'canUpdateAttributes': 'false',
        'canAddUri': 'false',
        'canTransferRole': 'true',
        'excludeMetaESDT': 'true',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections?${params}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftCollectionWithRoles>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].canCreate).toStrictEqual(true);
            expect(res.body[i].canBurn).toStrictEqual(true);
            expect(res.body[i].canAddQuantity).toStrictEqual(true);
            expect(res.body[i].canUpdateAttributes).toStrictEqual(false);
            expect(res.body[i].canAddUri).toStrictEqual(false);
            expect(res.body[i].role.canTransfer).toStrictEqual(true);
            expect(res.body[i].type).not.toStrictEqual('MetaESDT');
          }
        });
    });
  });

  describe('/accounts/{address}/roles/collections/count', () => {
    it(`should return the total number of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(6);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        filter: 'search',
        value: 'BONPASS-31488b',
        count: 1,
      },
      {
        filter: 'owner',
        value: 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz',
        count: 6,
      },
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
        count: 6,
      },

    ].forEach(({ filter, value, count }) => {
      describe(`when filter ${filter} is applied`, () => {
        it(`should return the total number of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, based on value ${value}`, async () => {
          const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
          await request(app.getHttpServer())
            .get(`${path}/${address}/roles/collections/count?${filter}=${value}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it(`should return the total number of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, when filters canCreate, canBurn, canAddQuantity, excludeMetaESDT are applied`, async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      const params = new URLSearchParams({
        'canCreate': 'true',
        'canBurn': 'true',
        'canAddQuantity': 'true',
        'excludeMetaESDT': 'false',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(5);
        });
    });
  });

  describe('/accounts/{address}/roles/collections/c', () => {
    it(`should return the alternative count of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/c`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(6);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/roles/collections/{collection}', () => {
    it('should return details about a specific NFT/SFT/MetaESDT collection from a given address', async () => {
      const address: string = 'erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      const collection: string = 'BONCARDS-9cde79';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/${collection}`)
        .expect(200)
        .then(res => {
          expect(res.body.collection).toStrictEqual(collection);
          expect(res.body.type).toStrictEqual("SemiFungibleESDT");
          expect(res.body.name).toStrictEqual("BattleOfNodesCards");
          expect(res.body.ticker).toStrictEqual("BONCARDS-9cde79");
          expect(res.body.owner).toStrictEqual("erd1v07t9d57hsftstsj6ua8fppjxz2gh585erjpfg3y4kk39nap58sqy9zvsz");
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.canFreeze).toStrictEqual(true);
          expect(res.body.canWipe).toStrictEqual(true);
          expect(res.body.canPause).toStrictEqual(true);
          expect(res.body.canTransferNftCreateRole).toStrictEqual(true);
          expect(res.body.canChangeOwner).toStrictEqual(false);
          expect(res.body.canUpgrade).toStrictEqual(false);
          expect(res.body.canAddSpecialRoles).toStrictEqual(false);
          expect(res.body.role).toBeDefined();
          expect(res.body.canTransfer).toStrictEqual(true);
          expect(res.body.canCreate).toStrictEqual(false);
          expect(res.body.canBurn).toStrictEqual(false);
          expect(res.body.canAddQuantity).toStrictEqual(false);
          expect(res.body.canUpdateAttributes).toStrictEqual(false);
          expect(res.body.canAddUri).toStrictEqual(false);
        });
    });

    it('should return 400 Bad Request for an invalid collection', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const collection: string = 'BONCA';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/${collection}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1v07t9d57pjxz2gh585erjpfg3y4kk39nap58sqy9zvsz';
      const collection: string = 'BONCARDS-9cde79';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/collections/${collection}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/roles/tokens', () => {
    it(`should return a list of Fungible token roles where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<TokenWithRoles>);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/roles/tokens/count', () => {
    it(`should return the total number of Fungible token roles where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(9);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/roles/tokens/c', () => {
    it(`should return the alternative count of Fungible token roles where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(9);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/roles/tokens/{identifier}', () => {
    it('should return details about Fungible token roles where the account is owner or has some special roles assigned to it', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const identifier: string = 'HUSDC-d80042';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/${identifier}`)
        .expect(200)
        .then(res => {
          expect(res.body.identifier).toStrictEqual(identifier);
          expect(res.body.type).toStrictEqual("FungibleESDT");
          expect(res.body.name).toStrictEqual("HatomUSDC");
          expect(res.body.ticker).toStrictEqual("HUSDC");
          expect(res.body.owner).toBeDefined();
          expect(res.body.decimals).toBeDefined();
          expect(res.body.isPaused).toStrictEqual(false);
          expect(res.body.assets).toBeDefined();
          expect(res.body.transactions).toBeDefined();
          expect(res.body.accounts).toBeDefined();
          expect(res.body.canUpgrade).toStrictEqual(true);
          expect(res.body.canMint).toStrictEqual(true);
          expect(res.body.canChangeOwner).toStrictEqual(true);
          expect(res.body.canAddSpecialRoles).toStrictEqual(true);
          expect(res.body.canFreeze).toStrictEqual(true);
          expect(res.body.canWipe).toStrictEqual(true);
          expect(res.body.canPause).toStrictEqual(true);
          expect(res.body.price).toBeDefined();
          expect(res.body.marketCap).toBeDefined();
          expect(res.body.supply).toBeDefined();
          expect(res.body.circulatingSupply).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.role).toBeDefined();
          expect(res.body.canLocalMint).toStrictEqual(true);
          expect(res.body.canLocalBurn).toStrictEqual(true);
          expect(res.body.canTransfer).toStrictEqual(true);
        });
    });

    it('should return 400 Bad Request for an invalid identifier', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const identifier: string = 'HUSDC';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/${identifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'identifier': Invalid token identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const identifier: string = 'HUSDC-d80042';
      await request(app.getHttpServer())
        .get(`${path}/${address}/roles/tokens/${identifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

  });

  describe('/accounts/{address}/collections', () => {
    it(`should return NFT/SFT/MetaESDT collections where the account owns one or more NFTs`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftCollectionAccount>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].type === 'NonFungibleESDT' || res.body[i].type === 'SemiFungibleESDT' || res.body[i].type === 'MetaESDT').toBe(true);
          }
        });
    });

    it(`should return NFT/SFT/MetaESDT collections where the account owns one or more NFTs, filtered by type`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections?type=NonFungibleESDT,MetaESDT`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftCollectionAccount>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].type === 'NonFungibleESDT' || res.body[i].type === 'MetaESDT').toBe(true);
          }
        });
    });

    it(`should return NFT/SFT/MetaESDT collections where the account owns one or more NFTs, when filter excludeMetaESDT is true`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections?excludeMetaESDT=true`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftCollectionAccount>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].type === 'NonFungibleESDT' || res.body[i].type === 'SemiFungibleESDT').toBe(true);
          }
        });
    });

    it('should return 400 Bad Request for an invalid type', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const params = new URLSearchParams({
        'type': 'fffffESDT',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections?${params}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT)");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/collections/count', () => {
    it(`should return the total number of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/count`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(9);
        });
    });

    it(`should return the total number of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, when filter excludeMetaESDT is true`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/count?excludeMetaESDT=true`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(8);
        });
    });

    it(`should return 0 for MetaESDT collections, when filter excludeMetaESDT is true and filter type is set as 'MetaESDT' `, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const params = new URLSearchParams({
        'type': 'MetaESDT',
        'excludeMetaESDT': 'true',
      });
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/count?${params}`)
        .expect(200)
        .then(res => {
          expect(+res.text).toStrictEqual(0);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hvymnnsnc4pml0jg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/collections/c', () => {
    it(`should return alternative count of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/c`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(9);
        });
    });

    it(`should return alternative count of NFT/SFT/MetaESDT collections where the account is owner or has some special roles assigned to it, when filter excludeMetaESDT is true`, async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/c?excludeMetaESDT=true`)
        .expect(200)
        .then(res => {
          expect(+res.text).toBeGreaterThanOrEqual(8);
        });
    });
  });


  describe('/accounts/{address}/collections/{collection}', () => {
    it('should return details about a specific NFT/SFT/MetaESDT collection from a given address', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const collection: string = 'ER9L-feab08';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/${collection}`)
        .expect(200)
        .then(res => {
          expect(res.body.collection).toStrictEqual(collection);
          expect(res.body.type).toStrictEqual("NonFungibleESDT");
          expect(res.body.name).toStrictEqual("eR9L");
          expect(res.body.ticker).toStrictEqual("ER9L-feab08");
          expect(res.body.owner).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.canFreeze).toStrictEqual(false);
          expect(res.body.canWipe).toStrictEqual(false);
          expect(res.body.canTransferNftCreateRole).toStrictEqual(false);
          expect(res.body.canChangeOwner).toStrictEqual(true);
          expect(res.body.canUpgrade).toStrictEqual(true);
          expect(res.body.canAddSpecialRoles).toStrictEqual(true);
          expect(res.body.count).toBeDefined();
        });
    });

    it('should return 400 Bad Request for an invalid collection', async () => {
      const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const collection: string = 'ER9L';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/${collection}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1rf4hv70mnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
      const collection: string = 'ER9L-feab08';
      await request(app.getHttpServer())
        .get(`${path}/${address}/collections/${collection}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/nfts', () => {
    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1c04typx388cmk72v9k4tcryvaykdy9pmq4fp4nl';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it(`should return a list of all available NFTs/SFTs/MetaESDTs owned by the provided address`, async () => {
      const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<NftAccount>);
        });
    });

    [
      {
        filter: 'excludeMetaESDT',
        value: 'true',
      },
      {
        filter: 'excludeMetaESDT',
        value: 'false',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'true') {
          it(`should return a list of all available NFTs/SFTs owned by the provided address`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type === 'SemiFungibleESDT' || res.body[i].type === 'NonFungibleESDT').toBe(true);
                }
              });
          });
        } else if (value === 'false') {
          it(`should return a list of all available NFTs/SFTs/MetaESDTs owned by the provided address`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type === 'SemiFungibleESDT' || res.body[i].type === 'NonFungibleESDT' || res.body[i].type === 'MetaESDT').toBe(true);
                }
              });
          });
        }
      });
    });

    [
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
      {
        filter: 'type',
        value: 'NonFungibleESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filters ${filter} and excludeMetaESDT are applied`, () => {
        if (value === 'NonFungibleESDT') {
          it(`should return a list of all available NFTs owned by the provided address`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?excludeMetaESDT=false&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('NonFungibleESDT');
                }
              });
          });
        } else if (value === 'SemiFungibleESDT') {
          it(`should return a list of all available SFTs owned by the provided address`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?excludeMetaESDT=false&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('SemiFungibleESDT');
                }
              });
          });
        } else if (value === 'MetaESDT') {
          it(`should return a list of all available MetaESDTs owned by the provided address`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?excludeMetaESDT=false&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                for (let i = 0; i < res.body.length; i++) {
                  expect(res.body[i].type).toStrictEqual('MetaESDT');
                }
              });
          });
          it(`should return empty array`, async () => {
            const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts?excludeMetaESDT=true&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(res.body).toBeInstanceOf(Array<NftAccount>);
                expect(res.body).toEqual([]);
              });
          });
        }
      });
    });
  });

  describe('/accounts/{address}/nft/count', () => {
    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1c04typx388cmk72v9k4tcryvaykdy9pmq4fp4nl';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        address: 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl',
        count: 5292,
      },
      {
        address: 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets',
        count: 4,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return the total number of NFT/SFT tokens from a given address ${address}, as well as the total number of a certain type of ESDT, when excludeMetaESDT is applied`, async () => {
          const params = new URLSearchParams({
            'excludeMetaESDT': 'false',
          });
          await request(app.getHttpServer())
            .get(`${path}/${address}/nfts/count?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
      {
        filter: 'type',
        value: 'NonFungibleESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'NonFungibleESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the total number of NFT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(5247);
              });
          });
        } else if (value === 'SemiFungibleESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the total number of SFT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(8);
              });
          });
        } else if (value === 'MetaESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the total number of MetaESDT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(37);
              });
          });
          it(`should return the total number of MetaESDT tokens for a given address ${address}, when filter excludeMetaESDT is true (expected NULL)`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toStrictEqual(0);
              });
          });
        }
      });
    });
  });

  describe('/accounts/{address}/nft/c', () => {
    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1c04typx388cmk72v9k4tcryvaykdy9pmq4fp4nl';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        address: 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl',
        count: 5292,
      },
      {
        address: 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets',
        count: 4,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return the alternative count of NFT/SFT tokens from a given address ${address}, as well as the total number of a certain type of ESDT, when excludeMetaESDT is applied`, async () => {
          const params = new URLSearchParams({
            'excludeMetaESDT': 'false',
          });
          await request(app.getHttpServer())
            .get(`${path}/${address}/nfts/c?${params}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    [
      {
        filter: 'type',
        value: 'SemiFungibleESDT',
      },
      {
        filter: 'type',
        value: 'MetaESDT',
      },
      {
        filter: 'type',
        value: 'NonFungibleESDT',
      },
    ].forEach(({ filter, value }) => {
      describe(`when filter ${filter} is applied`, () => {
        if (value === 'NonFungibleESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the alternative count of NFT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/count?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(5247);
              });
          });
        } else if (value === 'SemiFungibleESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the alternative count of SFT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(8);
              });
          });
        } else if (value === 'MetaESDT') {
          const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
          it(`should return the alternative count of MetaESDT tokens for a given address ${address}, when filter excludeMetaESDT is false`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'false',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toBeGreaterThanOrEqual(37);
              });
          });
          it(`should return the alternative count of MetaESDT tokens for a given address ${address}, when filter excludeMetaESDT is true (expected NULL)`, async () => {
            const params = new URLSearchParams({
              'excludeMetaESDT': 'true',
            });
            await request(app.getHttpServer())
              .get(`${path}/${address}/nfts/c?${params}&${filter}=${value}`)
              .expect(200)
              .then(res => {
                expect(+res.text).toStrictEqual(0);
              });
          });
        }
      });
    });
  });

  describe('/accounts/{address}/nft/{nft}', () => {
    it('should return details about a specific Fungible token for a given address', async () => {
      const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
      const nft: string = 'LOONAWL-52ed87-0cab';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts/${nft}`)
        .expect(200)
        .then(res => {
          expect(res.body.identifier).toStrictEqual(nft);
          expect(res.body.collection).toStrictEqual("LOONAWL-52ed87");
          expect(res.body.attributes).toStrictEqual("ICA=");
          expect(res.body.nonce).toBeDefined();
          expect(res.body.type).toStrictEqual("NonFungibleESDT");
          expect(res.body.name).toStrictEqual("ELoona Whitelisted");
          expect(res.body.creator).toStrictEqual("erd1wq2hgwjsqkav0h62dhu35g0waa2tt8t2w5jt9tydsqmw8m05rakq735w0x");
          expect(res.body.royalties).toBeDefined();
          expect(res.body.uris).toBeDefined();
          expect(res.body.url).toBeDefined();
          expect(res.body.media).toBeDefined();
          expect(res.body.isWhitelistedStorage).toStrictEqual(true);
          expect(res.body.ticker).toStrictEqual("LOONAWL-52ed87");
        });
    });

    it('should return 400 Bad Request for an invalid nft identifier', async () => {
      const address: string = 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl';
      const nft: string = 'LOONAW';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts/${nft}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'nft': Invalid NFT identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1c04typx38k5ygpk9k4tcryvaykdy9pmq4fp4nl';
      const nft: string = 'LOONAWL-52ed87-0cab';
      await request(app.getHttpServer())
        .get(`${path}/${address}/nfts/${nft}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/stake', () => {
    test.each`
        address
        ${'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqpy8lllls84ykc7'}
        ${'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqu8lllls8clacj'}`
      (
        `should summarize total staked amount for the given provider, as well as when and how much unbond will be performed`,
        async ({ address }) => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/stake`)
            .expect(200)
            .then(res => {
              expect(res.body.totalStaked).toBeDefined();
              expect(res.body.unstakedTokens).toBeDefined();
            });
        }
      );

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqpy8lllls84ykc7';
      await request(app.getHttpServer())
        .get(`${path}/${address}/stake`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/delegation', () => {
    it('should summarize all delegation positions with staking providers, together with unDelegation positions', async () => {
      const address: string = 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/delegation`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<AccountDelegation>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].address).toStrictEqual(address);
            expect(res.body[i].contract).toBeDefined();
            expect(res.body[i].userUnBondable).toBeDefined();
            expect(res.body[i].userActiveStake).toBeDefined();
            expect(res.body[i].claimableRewards).toBeDefined();
          }
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1ffvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/delegation`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  describe('/accounts/{address}/delegation-legacy', () => {
    it('should return staking information related to the legacy delegation pool', async () => {
      const address: string = 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/delegation-legacy`)
        .expect(200)
        .then(res => {
          expect(res.body.userWithdrawOnlyStake).toBeDefined();
          expect(res.body.userWaitingStake).toBeDefined();
          expect(res.body.userActiveStake).toBeDefined();
          expect(res.body.userUnstakedStake).toBeDefined();
          expect(res.body.userDeferredPaymentStake).toBeDefined();
          expect(res.body.claimableRewards).toBeDefined();
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1ffvt28ecpuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/delegation-legacy`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  describe('/accounts/{address}/keys', () => {
    test.each`
        address
        ${'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqprhllllsj9265l'}
        ${'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q'}`
      (
        `should return all active / queued nodes where the account is owner`,
        async ({ address }) => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/keys`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountKey>);
            });
        }
      );

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/keys`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        size: 3,
      },
      {
        size: 7,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} active / queued nodes where the account is owner`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
          await request(app.getHttpServer())
            .get(`${path}/${address}/keys?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountKey>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/transactions', () => {
    test.each`
        address
        ${'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e'}
        ${'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q'}`
      (
        `should return details of all transactions where the account is sender or receiver`,
        async ({ address }) => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transactions`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountKey>);
            });
        }
      );

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/keys`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/transactions/count', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l',
        count: 73,
      },
      {
        address: 'erd1lh08nq6j75s39vtgn2gtzed8p62nr77my8h3wyhdcv7xjql7gn9szasf5c',
        count: 1746,
      },
      {
        address: 'erd1sxhameujglefnrzxyj8eha6uxqtclezmjz3t27s3e9tew0ufhqqqkxz37g',
        count: 45,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return total number of transactions for a given address  ${address}, where the account is sender or receiver, as well as total transactions count that have a certain status`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transactions/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/transactions/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/transactions/c', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l',
        count: 73,
      },
      {
        address: 'erd1lh08nq6j75s39vtgn2gtzed8p62nr77my8h3wyhdcv7xjql7gn9szasf5c',
        count: 1746,
      },
      {
        address: 'erd1sxhameujglefnrzxyj8eha6uxqtclezmjz3t27s3e9tew0ufhqqqkxz37g',
        count: 45,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return alternative count of transactions for a given address  ${address}, where the account is sender or receiver, as well as total transactions count that have a certain status`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transactions/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/transactions/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/transfers', () => {
    test.each`
        address
        ${'erd1qqqqqqqqqqqqqpgqrgsjhg3cyhla4td4kdqz3mxpnsta6swzys5srynv6y'}
        ${'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790'}
        ${'erd1qqqqqqqqqqqqqpgq3uzpsutjdkf2fzf2xtr2hkj2am7pak5eys5shffwec'}`
      (
        `should return both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account`,
        async ({ address }) => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transfers`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<Transaction>);
            });
        }
      );

    [
      {
        size: 3,
      },
      {
        size: 7,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq3uzpsutjdkf2fzf2xtr2hkj2am7pak5eys5shffwec';
          await request(app.getHttpServer())
            .get(`${path}/${address}/transfers?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<Transaction>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/transfers`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/transfers/count', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq3uzpsutjdkf2fzf2xtr2hkj2am7pak5eys5shffwec',
        count: 47,
      },
      {
        address: 'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790',
        count: 13306,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return total count of tranfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transfers/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/transfers/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/transfers/c', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq3uzpsutjdkf2fzf2xtr2hkj2am7pak5eys5shffwec',
        count: 47,
      },
      {
        address: 'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790',
        count: 13306,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return alternative count of tranfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/transfers/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/transfers/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/contracts', () => {
    test.each`
        address
        ${'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790'}
        ${'erd1ap8q5g6e5ku78r4nuw752pmpnuu9ttxh2q2y7hdzs7dpwhhskz6q8w4nnw'}
        ${'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl'}`
      (
        `should return smart contracts details for a given account`,
        async ({ address }) => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/contracts`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<DeployedContract>);
            });
        }
      );

    [
      {
        size: 3,
      },
      {
        size: 7,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} smart contracts details for a given account`, async () => {
          const address: string = 'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790';
          await request(app.getHttpServer())
            .get(`${path}/${address}/contracts?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<DeployedContract>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/contracts`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/contracts/count', () => {
    [
      {
        address: 'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790',
        count: 8,
      },
      {
        address: 'erd1ap8q5g6e5ku78r4nuw752pmpnuu9ttxh2q2y7hdzs7dpwhhskz6q8w4nnw',
        count: 1,
      },
      {
        address: 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl',
        count: 7,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return total number of deployed contracts for a given address  ${address}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/contracts/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/contracts/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/contracts/c', () => {
    [
      {
        address: 'erd1uke5q3gae57w8zxr8ajl9kp3yqxqm2k6su25gm3ym8d7qltays5sscd790',
        count: 8,
      },
      {
        address: 'erd1ap8q5g6e5ku78r4nuw752pmpnuu9ttxh2q2y7hdzs7dpwhhskz6q8w4nnw',
        count: 1,
      },
      {
        address: 'erd1c04typx388cmk72vz9c4g0yjefeuek5ygpk9k4tcryvaykdy9pmq4fp4nl',
        count: 7,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return alternative count of deployed contracts for a given address  ${address}`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/contracts/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqqqqqqq9hllllsz2je7q';
      await request(app.getHttpServer())
        .get(`${path}/${address}/contracts/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/upgrades', () => {
    it('should return all upgrades details for a specific contract address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqrgsjhg3cyhla4td4kdqz3mxpnsta6swzys5srynv6y';
      await request(app.getHttpServer())
        .get(`${path}/${address}/upgrades`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<ContractUpgrades>);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1ffvt28ecpuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/upgrades`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });

    [
      {
        size: 3,
      },
      {
        size: 1,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} upgrades details for a specific contract address`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgqrgsjhg3cyhla4td4kdqz3mxpnsta6swzys5srynv6y';
          await request(app.getHttpServer())
            .get(`${path}/${address}/upgrades?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<ContractUpgrades>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/results', () => {
    it('should return smart contract results where the account is sender or receiver', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<SmartContractResult>);
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1ffvt28ecpuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });

    [
      {
        size: 100,
      },
      {
        size: 1000,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} smart contract results where the account is sender or receiver`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/results?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<SmartContractResult>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/results/count', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5',
        count: 2832,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqehedyl2ue2plvjtd9u02fkem2gjffsf79pmqj6p4xy',
        count: 10840,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqlptrfxrjj63gg954f2mh2lwge0ss8rjh9pmq302fdk',
        count: 286,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return the total number of smart contract results where the account  ${address} is sender or receiver`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/results/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqq0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/results/c', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5',
        count: 2832,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqehedyl2ue2plvjtd9u02fkem2gjffsf79pmqj6p4xy',
        count: 10840,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqlptrfxrjj63gg954f2mh2lwge0ss8rjh9pmq302fdk',
        count: 286,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return alternative count of smart contract results where the account  ${address} is sender or receiver`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/results/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqq0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/c`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/results/{scHash}', () => {
    it('should return 400 Bad Request for an invalid transaction hash', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      const scHash: string = 'c39611c081e958b0bbed3bb21ec9eed55a605e39e3ae03b5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/${scHash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for transaction hash 'scHash'. Length should be 64.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq9aa85xlk0z7hufq064epkz6qq045h5';
      const scHash: string = 'c39611c081e51b4ffa8982ce608958b0bbed3bb21ec9eed55a605e39e3ae03b5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/${scHash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it('should return 404 Smart contract result not found', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      const scHash: string = 'c396000000e51b4ffa8982ce608958b0bbed3bb21ec9eed55a605e39e3ae03b5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/${scHash}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual('Smart contract result not found');
        });
    });

    it('should return details of a smart contract result where the account is sender or receiver', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      const scHash: string = 'c39611c081e51b4ffa8982ce608958b0bbed3bb21ec9eed55a605e39e3ae03b5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/results/${scHash}`)
        .expect(200)
        .then(res => {
          expect(res.body.hash).toStrictEqual(scHash);
          expect(res.body.receiver === 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5' || res.body.sender === 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5').toBe(true);
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.nonce).toBeDefined();
          expect(res.body.gasLimit).toBeDefined();
          expect(res.body.gasPrice).toBeDefined();
          expect(res.body.value).toBeDefined();
          expect(res.body.miniBlockHash).toBeDefined();
          expect(res.body.prevTxHash).toBeDefined();
          expect(res.body.originalTxHash).toBeDefined();
          expect(res.body.function).toBeDefined();
        });
    });
  });

  describe('/accounts/{address}/history', () => {
    it('should return account EGLD balance history', async () => {
      const address: string = 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<AccountHistory>);
          expect(res.body).toHaveLength(25);
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1ffvt28ecpuup33adhr8wr2yuelwv7qpevs9e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });

    [
      {
        size: 2,
      },
      {
        size: 4,
      },
    ].forEach(({ size }) => {
      describe(`size = ${size}`, () => {
        it(`should return a list of ${size} items from the account EGLD balance history`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/history?size=${size}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountHistory>);
              expect(res.body).toHaveLength(size);
            });
        });
      });
    });

    [
      {
        after: 1702175646,
      },
      {
        after: 1701588120,
      },
    ].forEach(({ after }) => {
      describe(`after = ${after}`, () => {
        it(`should return account EGLD balance history, after ${after} timestamp`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/history?after=${after}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountHistory>);
              for (let i = 0; i < res.body.length; i++) {
                expect(res.body[i].timestamp).toBeGreaterThanOrEqual(after);
              }
            });
        });
      });
    });

    [
      {
        before: 1695236388,
      },
      {
        before: 1695991596,
      },
    ].forEach(({ before }) => {
      describe(`before = ${before}`, () => {
        it(`should return account EGLD balance history, before ${before} timestamp`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/history?before=${before}`)
            .expect(200)
            .then(res => {
              expect(res.body).toBeInstanceOf(Array<AccountHistory>);
              for (let i = 0; i < res.body.length; i++) {
                expect(res.body[i].timestamp).toBeLessThanOrEqual(before);
              }
            });
        });
      });
    });
  });

  describe('/accounts/{address}/history/count', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5',
        count: 477,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqehedyl2ue2plvjtd9u02fkem2gjffsf79pmqj6p4xy',
        count: 3093,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqlptrfxrjj63gg954f2mh2lwge0ss8rjh9pmq302fdk',
        count: 33,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return account ${address} EGLD balance history count`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqq0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    [
      {
        before: 1695236388,
        count: 7,
      },
      {
        before: 1695991596,
        count: 26,
      },
    ].forEach(({ before, count }) => {
      describe(`before = ${before}`, () => {
        it(`should return account EGLD balance history count, before ${before} timestamp`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/count?before=${before}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    [
      {
        after: 1702175646,
        count: 3,
      },
      {
        after: 1701588120,
        count: 8,
      },
    ].forEach(({ after, count }) => {
      describe(`after = ${after}`, () => {
        it(`should return account EGLD balance history count, after ${after} timestamp`, async () => {
          const address: string = 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5';
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/count?after=${after}`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/history/c', () => {
    [
      {
        address: 'erd1qqqqqqqqqqqqqpgq9a0dc9dmzyuteca85xlk0z7hufq064epkz6qq045h5',
        count: 477,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqehedyl2ue2plvjtd9u02fkem2gjffsf79pmqj6p4xy',
        count: 3093,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqlptrfxrjj63gg954f2mh2lwge0ss8rjh9pmq302fdk',
        count: 33,
      },
    ].forEach(({ address, count }) => {
      describe(`address = ${address}`, () => {
        it(`should return account ${address} EGLD balance history alternative count`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/history/{tokenIdentifier}/count', () => {
    [
      {
        address: 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e',
        tokenIdentifier: 'AIR-317920',
        count: 1,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr',
        tokenIdentifier: 'HSEGLD-c13a4e',
        count: 45082,
      },
    ].forEach(({ address, tokenIdentifier, count }) => {
      describe(`address = ${address} & tokenIdentifier = ${tokenIdentifier}`, () => {
        it(`should return account token balance history count`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/${tokenIdentifier}/count`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const tokenIdentifier: string = 'HSEGLD-c13a4e';
      const address: string = 'erd1qqqqqqqqqqqqqpgqxpcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}/count`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });
  });

  describe('/accounts/{address}/history/{tokenIdentifier}/c', () => {
    [
      {
        address: 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e',
        tokenIdentifier: 'AIR-317920',
        count: 1,
      },
      {
        address: 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr',
        tokenIdentifier: 'HSEGLD-c13a4e',
        count: 45082,
      },
    ].forEach(({ address, tokenIdentifier, count }) => {
      describe(`address = ${address} & tokenIdentifier = ${tokenIdentifier}`, () => {
        it(`should return account token balance history alternative count`, async () => {
          await request(app.getHttpServer())
            .get(`${path}/${address}/history/${tokenIdentifier}/c`)
            .expect(200)
            .then(res => {
              expect(+res.text).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('/accounts/{address}/history/{tokenIdentifier}', () => {
    it('should return 400 Bad Request for an invalid token identifier', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const tokenIdentifier: string = 'HSEGLD';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'tokenIdentifier': Invalid token / NFT identifier.");
        });
    });

    it('should return 400 Bad Request for an invalid address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqrfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const tokenIdentifier: string = 'HSEGLD-c13a4e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it('should return 404 token not found', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const tokenIdentifier: string = 'HSEGLD-c13a4a';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual("Token 'HSEGLD-c13a4a' not found");
        });
    });

    it('should return account token balance history', async () => {
      const address: string = 'erd1ff377y7qdldtsahvt28ec45zkyu0pepuup33adhr8wr2yuelwv7qpevs9e';
      const tokenIdentifier: string = 'AIR-317920';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<AccountEsdtHistory>);
          expect(res.body[0].address).toStrictEqual(address);
        });
    });

    it('should return account token balance history', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr';
      const tokenIdentifier: string = 'HSEGLD-c13a4e';
      await request(app.getHttpServer())
        .get(`${path}/${address}/history/${tokenIdentifier}`)
        .expect(200)
        .then(res => {
          expect(res.body).toBeInstanceOf(Array<AccountEsdtHistory>);
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i].address).toStrictEqual(address);
          }
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});

