import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { AccountDetails } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';

export class AccountDetailsRepository {
    constructor(
        @InjectModel(AccountDetails.name)
        private readonly accountDetailsModel: Model<AccountDetails>
    ) { }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-tokens')
    async getTokens(address: string, queryPagination: QueryPagination): Promise<TokenWithBalance[]> {
        try {
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                { $unwind: '$tokens' },
                { $skip: queryPagination.from },
                { $limit: queryPagination.size },
                {
                    $group: {
                        _id: null,
                        tokens: { $push: '$tokens' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        tokens: 1
                    }
                }
            ]).exec();

            return result[0]?.tokens || [];
        } catch (error) {
            console.error('Error fetching tokens:', error);
            return [];
        }
    }


    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-nfts')
    async getNfts(address: string, queryPagination: QueryPagination): Promise<NftAccount[]> {
        try {
            const result = await this.accountDetailsModel.aggregate([
                { $match: { address } },
                { $unwind: '$nfts' },
                { $skip: queryPagination.from },
                { $limit: queryPagination.size },
                {
                    $group: {
                        _id: null,
                        tokens: { $push: '$nfts' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        nfts: 1
                    }
                }
            ]).exec();

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
                { _id: 0, __v: 0, tokens: 0, nfts: 0 }
            );
            if (!accountDb) {
                return null;
            }
            return accountDb;
        } catch (error) {
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