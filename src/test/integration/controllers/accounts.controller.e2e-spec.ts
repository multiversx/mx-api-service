import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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
        it('should return 25 accounts available on blockchain', async () => {
            await request(app.getHttpServer())
                .get(`${path}`)
                .expect(200)
                .then(res => {
                    expect(res.body).toHaveLength(25);
                });
        });

        it('should return 1 account details', async () => {
            const params = new URLSearchParams({
                'size': '1',
            });

            await request(app.getHttpServer())
                .get(`${path}?${params}`)
                .expect(200)
                .then(res => {
                    expect(res.body).toHaveLength(1);
                });
        });

        it('should return 7 accounts', async () => {
            const params = new URLSearchParams({
                'from': '80',
                'size': '7',
            });

            await request(app.getHttpServer())
                .get(`${path}?${params}`)
                .expect(200)
                .then(res => {
                    expect(res.body).toHaveLength(7);
                });
        });

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
        ].forEach(({ filter, value }) => {
            describe(`when filter ${filter} is applied`, () => {
                it(`should return accounts details based on ${filter} with value ${value} and ordered descendent `, async () => {
                    const order = 'desc';

                    await request(app.getHttpServer())
                        .get(`${path}?${filter}=${value}&${order}`)
                        .expect(200)
                        .then(res => {
                            expect(res.body).toBeDefined();
                            expect(Number(res.body[0].balance)).toBeGreaterThan(Number(res.body[1].balance));
                        });
                });
            });
        });

        [
            {
                filter: 'sort',
                value: 'timestamp',
            },
        ].forEach(({ filter, value }) => {
            describe(`when filter ${filter} is applied`, () => {
                it(`should return accounts details based on ${filter} with value ${value} and ordered descendent `, async () => {
                    const order = 'desc';

                    await request(app.getHttpServer())
                        .get(`${path}?${filter}=${value}&${order}`)
                        .expect(200)
                        .then(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body[0].timestamp).toBeGreaterThanOrEqual(res.body[1].timestamp);
                        });
                });
            });
        });

        test.each`
        size
        ${1}
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
    });

    describe('/accounts/count', () => {
        it('should return count of all blocks from all shards', async () => {
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
                    expect(res.body.balance).toStrictEqual('333118000000000000000');
                    expect(res.body.nonce).toStrictEqual(0);
                    expect(res.body.timestamp).toStrictEqual(1700842188);
                    expect(res.body.shard).toStrictEqual(2);
                    expect(res.body.ownerAddress).toStrictEqual('erd1ajyez9tt0a9sra5mvm44g0rlzzg9yfytrw3twt0z8dr4wg7zmlwq7w8xv6');
                    expect(res.body.assets).toBeDefined();
                    expect(res.body.code).toBeDefined();
                    expect(res.body.codeHash).toStrictEqual('KiHTQKSCnk9+wjZZL0jeS2vV2E3dIVxrG0CgNqoroJc=');
                    expect(res.body.rootHash).toStrictEqual('at+/lZ/9vwrRPDLkwXau559k7n8qyJ0DVm8tMIgcBuU=');
                    expect(res.body.txCount).toStrictEqual(38364);
                    expect(res.body.scrCount).toStrictEqual(32687);
                    expect(res.body.developerReward).toStrictEqual('902351461371000000');
                    expect(res.body.isPayableBySmartContract).toStrictEqual(true);
                    expect(res.body.isUpgradeable).toStrictEqual(true);
                    expect(res.body.isReadable).toStrictEqual(true);
                    expect(res.body.isGuarded).toStrictEqual(false);
                    expect(res.body.isPayable).toStrictEqual(false);
                    expect(res.body.deployTxHash).toStrictEqual('215e24332cc2734e499be534268a7badd13dcf82735cfc0ab571fe09d9fe0804');
                    expect(res.body.deployedAt).toStrictEqual(1689340068);
                });
        });
    });

    describe('Validations', () => {
        it('should return 400 Bad Request for an invalid address', async () => {
            const address: string = 'erd1qqqqqqqk8dal6wyqje72csqma5j6ncguwj4zvdqc6xzwj';

            await request(app.getHttpServer())
                .get(`${path}/${address}`)
                .expect(400)
                .then(res => {
                    expect(res.body.message).toContain("Validation failed");
                });
        });
    });

    afterEach(async () => {
        await app.close();
    });

});
