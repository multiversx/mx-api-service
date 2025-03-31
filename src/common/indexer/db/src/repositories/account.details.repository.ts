import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { AccountDetails } from '../schemas';
import { AccountDetailed } from 'src/endpoints/accounts-v2/entities/account.detailed';
import { InjectModel } from '@nestjs/mongoose';

export class AccountDetailsRepository {
    constructor(
        @InjectModel(AccountDetails.name)
        private readonly accounntDetailsModel: Model<AccountDetails>
    ) { }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async getAccount(address: string): Promise<AccountDetails | null> {
        try {
            const accountDb = await this.accounntDetailsModel.findOne({ address }).lean();
            if (!accountDb) {
                return null;
            }
            return accountDb;
        } catch (error) {
            return null;
        }
    }

    @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'account-details')
    async updateAccount(accountDetailed: AccountDetailed): Promise<AccountDetails | null> {
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
            const updatedAccount = await this.accounntDetailsModel.findOneAndUpdate(
                { address: accountDetailed.address },
                { $set: updateFields },
                {
                    new: true, // Return the updated document
                    upsert: true, // Create if doesn't exist
                    lean: true // Return plain JavaScript object
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
}