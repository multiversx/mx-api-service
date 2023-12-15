import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDeferred } from 'src/endpoints/accounts/entities/account.deferred';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';
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
                    it(`should returns a list of all available fungible and meta tokens for a given address`, async () => {
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
                    it(`should returns a list of all available fungible tokens for a given address`, async () => {
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
                    it(`should returns a list of all available fungible tokens for a given address`, async () => {
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
                    it(`should returns a list of all available meta tokens for a given address`, async () => {
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
                    it(`should returns null`, async () => {
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

        it('should return 404 Not Found for a non-fungible token from a given address', async () => {
            const address: string = 'erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p';
            const token: string = 'LKMEX-aab910-323141';

            await request(app.getHttpServer())
                .get(`${path}/${address}/tokens/${token}`)
                .expect(404)
                .then(res => {
                    expect(res.body.message).toStrictEqual("Token for given account not found");
                });
        });

        it('should return details about a specific fungible token from a given address', async () => {
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
                    //expect(res.body.canAddSpecialRoles).toStrictEqual(true);
                    //error?
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

    });

    describe('/accounts/{address}/roles/collections/count', () => {

    });

    describe('/accounts/{address}/roles/collections/{collection}', () => {

    });

    describe('/accounts/{address}/roles/tokens', () => {

    });

    describe('/accounts/{address}/roles/tokens/count', () => {

    });

    describe('/accounts/{address}/roles/tokens/{identifier}', () => {

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

    describe('/accounts/{address}/nft', () => {

    });

    describe('/accounts/{address}/nft/count', () => {

    });

    describe('/accounts/{address}/nft/{nft}', () => {

    });

    describe('/accounts/{address}/stake', () => {

    });

    describe('/accounts/{address}/delegation', () => {

    });

    describe('/accounts/{address}/delegation-legacy', () => {

    });

    describe('/accounts/{address}/keys', () => {

    });

    describe('/accounts/{address}/waiting-list', () => {

    });

    describe('/accounts/{address}/transactions', () => {

    });

    describe('/accounts/{address}/transactions/count', () => {

    });

    describe('/accounts/{address}/transfers', () => {

    });

    describe('/accounts/{address}/transfers/count', () => {

    });

    describe('/accounts/{address}/contracts', () => {

    });

    describe('/accounts/{address}/contracts/count', () => {

    });

    describe('/accounts/{address}/upgrades', () => {

    });

    describe('/accounts/{address}/results', () => {

    });

    describe('/accounts/{address}/results/count', () => {

    });

    describe('/accounts/{address}/results/{scHash}', () => {

    });

    describe('/accounts/{address}/history', () => {

    });

    describe('/accounts/{address}/history/count', () => {

    });

    describe('/accounts/{address}/history/{tokenIdentifier}/count', () => {

    });

    describe('/accounts/{address}/history/{tokenIdentifier}', () => {

    });

    afterEach(async () => {
        await app.close();
    });
});

