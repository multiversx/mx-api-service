import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { AccountDetails } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class AccountDetailsRepository {
    private readonly logger = new OriginLogger(AccountDetailsRepository.name);
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
    };
    constructor(
        @InjectModel(AccountDetails.name)
        private readonly accountDetailsModel: Model<AccountDetails>
    ) { }

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
            return new AccountDetailed({ ...accountDb, nonce: accountDb.nonce });
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
                    projection: { __v: 0, __id: 0, updatedAt: 0 }, // Exclude __v field
                }
            );
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

            const operations: any[] = [];

            for (const accountDetailed of accounts) {
                const updatePipeline: any[] = [];

                // --- helper ---
                const isValidValue = (value: any): boolean =>
                    value != null;

                // --- simple fields ---
                const updateFields: any = {};
                Object.entries(accountDetailed).forEach(([key, value]) => {
                    if (isValidValue(value)) {
                        updateFields[key as keyof AccountDetails] = value;
                    }

                });
                if (Object.keys(updateFields).length > 0) {
                    updatePipeline.push({ $set: updateFields });
                }
                if (updatePipeline.length > 0) {
                    operations.push({
                        updateOne: {
                            filter: { address: accountDetailed.address },
                            update: updatePipeline, // <<--- pipeline array
                            upsert: true,
                        },
                    });
                    totalOperations++;
                }
            }

            this.logger.log(`number of accounts write operations: ${totalOperations}`);
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
