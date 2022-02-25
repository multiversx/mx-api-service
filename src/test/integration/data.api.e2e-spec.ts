import { PublicAppModule } from './../../public.app.module';
import { DataApiService } from './../../common/external/data.api.service';
import { Test } from '@nestjs/testing';
import { Constants } from 'src/utils/constants';
import Initializer from './e2e-init';
import { DataQuoteType } from 'src/common/external/entities/data.quote.type';

describe('Data Api Service', () => {
    let dataApiService: DataApiService;

    beforeAll(async () => {
        await Initializer.initialize();

        const moduleRef = await Test.createTestingModule({
            imports: [PublicAppModule],
        }).compile();

        dataApiService = moduleRef.get<DataApiService>(DataApiService);

    }, Constants.oneHour() * 1000);

    it("should return historical timestamp", async () => {
        const today = new Date();
        const date = today.getTime();

        const timestamp = await dataApiService.getQuotesHistoricalTimestamp(DataQuoteType.price, date / 1000);
        console.log(timestamp);
    });
});
