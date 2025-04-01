import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { AccountDetails } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';

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
    async getTokens(address: string, queryPagination: QueryPagination): Promise<TokenWithBalance[]> {
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
            console.error('Error fetching tokens:', error);
            return [];
        }
    }


    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-nfts')
    async getNfts(address: string, queryPagination: QueryPagination): Promise<NftAccount[]> {
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
            console.error('Error fetching nfts:', error);
            return [];
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async getAccount(address: string): Promise<AccountDetails | null> {
        try {
            const accountDb = await this.accountDetailsModel.findOne(
                { address },
                { _id: 0, __v: 0, tokens: 0, nfts: 0, updatedAt: 0, createdAt: 0 }
            ).lean();
            if (!accountDb) {
                return null;
            }
            return accountDb;
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
}