import { Model } from 'mongoose';
import { LogPerformanceAsync } from 'src/utils/log.performance.decorator';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { EsdtDetails } from '../schemas/esdt.details.schema';

@Injectable()
export class EsdtDetailsRepository {
  private readonly logger = new OriginLogger(EsdtDetailsRepository.name);
  constructor(
    @InjectModel(EsdtDetails.name)
    private readonly esdtDetailsModel: Model<EsdtDetails>
  ) { }

  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'esdt-details')
  async getEsdt(address: string, identifier: string): Promise<EsdtDetails | null> {
    try {
      const esdtDb = await this.esdtDetailsModel.findOne(
        { address, identifier },
        { _id: 0, __v: 0, tokens: 0, nfts: 0, updatedAt: 0, createdAt: 0, code: 0 }
      ).lean();
      if (!esdtDb) {
        return null;
      }
      return new EsdtDetails({ ...esdtDb });
    } catch (error) {
      console.error('Error fetching esdt:', error);
      return null;
    }
  }


  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'esdt-details')
  async updateEsdts(esdts: EsdtDetails[]): Promise<any> {
    try {
      if (!esdts.length) return [];
      let totalOperations = 0;

      const operations: any[] = [];

      for (const esdtDetailed of esdts) {
        if (esdtDetailed.balance === '0') {
          operations.push({
            deleteOne: {
              filter: {
                address: esdtDetailed.address,
                identifier: esdtDetailed.identifier,
              },
            },
          });

          totalOperations++;
          continue;
        }

        const updatePipeline: any[] = [];

        const isValidValue = (value: any): boolean =>
          value != null;

        const updateFields: any = {};
        Object.entries(esdtDetailed).forEach(([key, value]) => {
          if (isValidValue(value)) {
            updateFields[key as keyof EsdtDetails] = value;
          }
        });

        if (Object.keys(updateFields).length > 0) {
          updatePipeline.push({ $set: updateFields });
        }

        if (updatePipeline.length > 0) {
          operations.push({
            updateOne: {
              filter: {
                address: esdtDetailed.address,
                identifier: esdtDetailed.identifier,
              },
              update: updatePipeline,
              upsert: true,
            },
          });
          totalOperations++;
        }
      }

      this.logger.log(`number of esdts write operations: ${totalOperations}`);

      const result = await this.esdtDetailsModel.bulkWrite(operations, {
        ordered: true,
      });

      return result;
    } catch (error: any) {
      console.error('Error updating esdts:', error);
      throw error;
    }
  }

}
