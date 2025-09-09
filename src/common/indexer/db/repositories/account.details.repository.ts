import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { AccountDetails } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';
import { Injectable } from '@nestjs/common';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';

@Injectable()
export class AccountDetailsRepository {
    static readonly exclusionFields = {
        _id: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        address: 0,
        balance: 0,
        nonce: 0,
        timestamp: 0,
        shard: 0,
        ownerAddress: 0,
        assets: 0,
        deployedAt: 0,
        deployTxHash: 0,
        ownerAssets: 0,
        isVerified: 0,
        txCount: 0,
        scrCount: 0,
        transfersLast24h: 0,
        code: 0,
        codeHash: 0,
        rootHash: 0,
        username: 0,
        developerReward: 0,
        isUpgradeable: 0,
        isReadable: 0, isPayable: 0,
        isPayableBySmartContract: 0,
        scamInfo: 0,
        nftCollections: 0,
        activeGuardianActivationEpoch: 0,
        activeGuardianAddress: 0,
        activeGuardianServiceUid: 0,
        pendingGuardianActivationEpoch: 0,
        pendingGuardianAddress: 0,
        pendingGuardianServiceUid: 0,
        isGuarded: 0,
    }
    constructor(
        @InjectModel(AccountDetails.name)
        private readonly accountDetailsModel: Model<AccountDetails>
    ) { }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-tokens')
    async getTokensForAddress(address: string, queryPagination: QueryPagination): Promise<TokenWithBalance[]> {
        try {
            // TODO: add more fields in project on demand
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                {
                    $project: {
                        _id: 0,
                        tokens: {
                            $slice: ["$tokens", queryPagination.from, queryPagination.size]
                        },
                    }
                },
                {
                    $project: {
                        "tokens.type": 1,
                        "tokens.subType": 1,
                        "tokens.identifier": 1,
                        "tokens.collection": 1,
                        "tokens.name": 1,
                        "tokens.nonce": 1,
                        "tokens.decimals": 1,
                        "tokens.balance": 1,
                    }
                }
            ]).exec();
            // const result = await this.accountDetailsModel.findOne(
            //     { address },
            //     {
            //         tokens: {
            //             $slice: [queryPagination.from, queryPagination.size],
            //         },
            //         "tokens.balance": 0, // Exclude direct balance
            //         ...AccountDetailsRepository.exclusionFields,
            //     }
            // ).lean();
            //@ts-ignore
            // console.log('result', result);
            // console.log('result', result);
            return result[0]?.tokens ?? [];
        } catch (error) {
            console.error(`Error fetching tokens for address: ${address}:`, error);
            return [];
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-tokens')
    async getTokenForAddress(address: string, identifier: string): Promise<TokenWithBalance | undefined> {
        try {
            // TODO: add more fields in project on demand
            // TODO: search for token efficiently: return first occurence and use index on identifier
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                {
                    $project: {
                        _id: 0,
                        tokens: {
                            $filter: {
                                input: "$tokens",
                                as: "token",
                                cond: { $eq: ["$$token.identifier", identifier] }
                            }
                        }
                    }
                },
                {
                    $project: {
                        "tokens.type": 1,
                        "tokens.subType": 1,
                        "tokens.identifier": 1,
                        "tokens.collection": 1,
                        "tokens.name": 1,
                        "tokens.nonce": 1,
                        "tokens.decimals": 1,
                        "tokens.balance": 1,
                    }
                }
            ]).exec();
            // console.log('result', result);
            // const result = await this.accountDetailsModel.findOne(
            //     { address },
            //     {
            //         tokens: {
            //             $slice: [queryPagination.from, queryPagination.size],
            //         },
            //         "tokens.balance": 0, // Exclude direct balance
            //         ...AccountDetailsRepository.exclusionFields,
            //     }
            // ).lean();
            //@ts-ignore
            // console.log('result', result);
            // console.log('result', result);
            // console.log(result[0].tokens)
            return result[0]?.tokens[0] ?? undefined;
        } catch (error) {
            console.error(`Error fetching token with  identifier ${identifier} for address: ${address}:`, error);
            return undefined;
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-nfts')
    async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
        try {
            // TODO: add more fields in project on demand
            // TODO: search for nft efficiently: return first occurence and use index on identifier
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                {
                    $project: {
                        _id: 0,
                        nfts: {
                            $filter: {
                                input: "$nfts",
                                as: "nft",
                                cond: { $eq: ["$$nft.identifier", identifier] }
                            }
                        }
                    }
                },
                {
                    $project: {
                        "nfts.identifier": 1,
                        "nfts.collection": 1,
                        "nfts.nonce": 1,
                        "nfts.type": 1,
                        "nfts.subType": 1,
                        "nfts.name": 1,
                    }
                }
            ]).exec();
            // const result = await this.accountDetailsModel.findOne(
            //     { address },
            //     {
            //         nfts: {
            //             $slice: [queryPagination.from, queryPagination.size]
            //         },
            //         tokens: 0,
            //         ...AccountDetailsRepository.exclusionFields,
            //     }
            // ).lean();
            return result[0]?.nfts[0] ?? undefined;
        } catch (error) {
            console.error(`Error fetching nft with  identifier ${identifier} for address: ${address}:`, error);
            return undefined;
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-nfts')
    async getNftsForAddress(address: string, queryPagination: QueryPagination): Promise<NftAccount[]> {
        try {
            // TODO: add more fields in project on demand
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                {
                    $project: {
                        _id: 0,
                        nfts: { $slice: ["$nfts", queryPagination.from, queryPagination.size] }
                    }
                },
                {
                    $project: {
                        "nfts.identifier": 1,
                        "nfts.collection": 1,
                        "nfts.nonce": 1,
                        "nfts.type": 1,
                        "nfts.subType": 1,
                        "nfts.name": 1,
                    }
                }
            ]).exec();
            // const result = await this.accountDetailsModel.findOne(
            //     { address },
            //     {
            //         nfts: {
            //             $slice: [queryPagination.from, queryPagination.size]
            //         },
            //         tokens: 0,
            //         ...AccountDetailsRepository.exclusionFields,
            //     }
            // ).lean();

            return result[0]?.nfts || [];
        } catch (error) {
            console.error(`Error fetching nfts for address: ${address}:`, error);
            return [];
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async getAccount(address: string): Promise<AccountDetailed | null> {
        try {
            const accountDb = await this.accountDetailsModel.findOne(
                { address },
                { _id: 0, __v: 0, tokens: 0, nfts: 0, updatedAt: 0, createdAt: 0, code: 0 }
            ).lean();
            if (!accountDb) {
                return null;
            }
            return new AccountDetailed({ ...accountDb, nonce: parseInt(accountDb.nonce) });
        } catch (error) {
            console.error('Error fetching account:', error);
            return null;
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async updateAccount(accountDetailed: AccountDetails): Promise<AccountDetails | null> {
        try {
            // Create update object with all fields from accountDetailed
            const updateFields: Partial<AccountDetails> = {};

            // Helper function to check if a value is valid for update
            const isValidValue = (value: any): boolean => {
                return value !== undefined && value !== null;
            };

            // Build update object with all valid fields from accountDetailed
            Object.entries(accountDetailed).forEach(([key, value]) => {
                if (isValidValue(value)) {
                    updateFields[key as keyof AccountDetails] = value;
                }
            });
            // Use findOneAndUpdate with upsert option
            const updatedAccount = await this.accountDetailsModel.findOneAndUpdate(
                { address: accountDetailed.address },
                { $set: updateFields },
                {
                    new: true, // Return the updated document
                    upsert: true, // Create if doesn't exist
                    lean: true, // Return plain JavaScript object
                    projection: { __v: 0, __id: 0, updatedAt: 0 } // Exclude __v field
                }
            );
            // console.log('updatedAccount', updatedAccount);
            return updatedAccount;
        } catch (error: any) {
            // Handle potential duplicate key errors
            if (error.code !== 11000) {
                throw error;
            }
            return null;
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async updateAccounts(accounts: AccountDetails[]): Promise<any> {
        try {
            if (!accounts.length) return [];
            let totalOperations = 0;
            const operations = accounts.map((accountDetailed) => {
                const updateFields: any = {};
                const isValidValue = (value: any): boolean =>
                    value !== undefined && value !== null;

                Object.entries(accountDetailed).forEach(([key, value]) => {
                    if (isValidValue(value) && key !== "tokens" && key !== "nfts") {
                        updateFields[key as keyof AccountDetails] = value;
                    }
                });

                const updateOps: any[] = [];

                if (Object.keys(updateFields).length > 0) {
                    updateOps.push({ $set: updateFields });
                }

                // --- tokens ---
                if (accountDetailed.tokens?.length) {
                    updateOps.push({
                        $set: {
                            tokens: {
                                $let: {
                                    vars: { newTokens: accountDetailed.tokens },
                                    in: {
                                        $concatArrays: [
                                            {
                                                $map: {
                                                    input: { $ifNull: ["$tokens", []] }, // asigurăm array gol dacă tokens nu există
                                                    as: "t",
                                                    in: {
                                                        $let: {
                                                            vars: {
                                                                updated: {
                                                                    $filter: {
                                                                        input: "$$newTokens",
                                                                        cond: { $eq: ["$$this.identifier", "$$t.identifier"] },
                                                                    },
                                                                },
                                                            },
                                                            in: {
                                                                $cond: [
                                                                    { $gt: [{ $size: "$$updated" }, 0] },
                                                                    { $arrayElemAt: ["$$updated", 0] },
                                                                    "$$t",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                $filter: {
                                                    input: "$$newTokens",
                                                    cond: {
                                                        $not: {
                                                            $in: [
                                                                "$$this.identifier",
                                                                {
                                                                    $map: {
                                                                        input: { $ifNull: ["$tokens", []] },
                                                                        as: "t",
                                                                        in: "$$t.identifier",
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    });
                }

                // --- nfts (analog tokens) ---
                if (accountDetailed.nfts?.length) {
                    updateOps.push({
                        $set: {
                            nfts: {
                                $let: {
                                    vars: { newNfts: accountDetailed.nfts },
                                    in: {
                                        $concatArrays: [
                                            {
                                                $map: {
                                                    input: { $ifNull: ["$nfts", []] }, // asigurăm array gol dacă nfts nu există
                                                    as: "n",
                                                    in: {
                                                        $let: {
                                                            vars: {
                                                                updated: {
                                                                    $filter: {
                                                                        input: "$$newNfts",
                                                                        cond: { $eq: ["$$this.identifier", "$$n.identifier"] },
                                                                    },
                                                                },
                                                            },
                                                            in: {
                                                                $cond: [
                                                                    { $gt: [{ $size: "$$updated" }, 0] },
                                                                    { $arrayElemAt: ["$$updated", 0] },
                                                                    "$$n",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                $filter: {
                                                    input: "$$newNfts",
                                                    cond: {
                                                        $not: {
                                                            $in: [
                                                                "$$this.identifier",
                                                                {
                                                                    $map: {
                                                                        input: { $ifNull: ["$nfts", []] },
                                                                        as: "n",
                                                                        in: "$$n.identifier",
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    });
                }
                totalOperations += updateOps.length;
                return {
                    updateOne: {
                        filter: { address: accountDetailed.address },
                        update: updateOps,
                        upsert: true,
                    },
                };
            });
            console.log('number of write operations:', totalOperations);
            const result = await this.accountDetailsModel.bulkWrite(operations, {
                ordered: true,
            });

            return result;
        } catch (error: any) {
            console.error('Error updating accounts:', error);
            throw error;
        }
    }

}