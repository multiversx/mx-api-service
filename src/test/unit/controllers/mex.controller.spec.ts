import { INestApplication } from "@nestjs/common";
import { mockMexEconomicsService, mockMexFarmsService, mockMexPairService, mockMexSettingsService, mockMexTokensService } from "./services.mock/mex.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { MexController } from "src/endpoints/mex/mex.controller";
import { MexSettingsService } from "src/endpoints/mex/mex.settings.service";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import request = require('supertest');
import { PublicAppModule } from "src/public.app.module";
import { QueryPagination } from "src/common/entities/query.pagination";
import { MexPairExchange } from "src/endpoints/mex/entities/mex.pair.exchange";
import { MexPairsFilter } from 'src/endpoints/mex/entities/mex.pairs..filter';

describe('MexController', () => {
  let app: INestApplication;
  const path = '/mex';

  const mexSettingsServiceMocks = mockMexSettingsService();
  const mexEconomicsServiceMocks = mockMexEconomicsService();
  const mexPairServiceMocks = mockMexPairService();
  const mexTokensServiceMocks = mockMexTokensService();
  const mexFarmsServiceMocks = mockMexFarmsService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MexController],
      imports: [PublicAppModule],
    }).overrideProvider(MexSettingsService).useValue(mexSettingsServiceMocks)
      .overrideProvider(MexEconomicsService).useValue(mexEconomicsServiceMocks)
      .overrideProvider(MexPairService).useValue(mexPairServiceMocks)
      .overrideProvider(MexTokenService).useValue(mexTokensServiceMocks)
      .overrideProvider(MexFarmService).useValue(mexFarmsServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /mex/setting', () => {
    it('should return mex settings details', async () => {
      mexSettingsServiceMocks.getSettings.mockReturnValue({});
      await request(app.getHttpServer())
        .get(`${path}/settings`)
        .expect(200);

      expect(mexSettingsServiceMocks.getSettings).toHaveBeenCalled();
    });
  });

  describe('GET /mex/economics', () => {
    it('should return mex economics details', async () => {
      mexEconomicsServiceMocks.getMexEconomics.mockReturnValue({});
      await request(app.getHttpServer())
        .get(`${path}/economics`)
        .expect(200);

      expect(mexEconomicsServiceMocks.getMexEconomics).toHaveBeenCalled();
    });
  });

  describe('GET /mex/pairs', () => {
    it('should return a list of mex pairs', async () => {
      mexPairServiceMocks.getMexPairs.mockReturnValue([]);
      await request(app.getHttpServer())
        .get(`${path}/pairs`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPairs).toHaveBeenCalledWith(
        0, 25, new MexPairsFilter({ exchange: undefined, includeFarms: false })
      );
    });

    it('should return a list of mex pairs with size equal with 5', async () => {
      mexPairServiceMocks.getMexPairs.mockReturnValue([]);
      const queryPagination = new QueryPagination({ from: 0, size: 5 });

      await request(app.getHttpServer())
        .get(`${path}/pairs?size=${queryPagination.size}`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPairs).toHaveBeenCalledWith(
        0, 5, new MexPairsFilter({ exchange: undefined, includeFarms: false })
      );
    });

    it('should return a list of mex pairs from exchange source', async () => {
      mexPairServiceMocks.getMexPairs.mockReturnValue([]);
      const queryPagination = new QueryPagination({ from: 0, size: 5 });

      await request(app.getHttpServer())
        .get(`${path}/pairs?size=${queryPagination.size}&exchange=${MexPairExchange.xexchange}`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPairs).toHaveBeenCalledWith(
        0, 5, new MexPairsFilter({ exchange: MexPairExchange.xexchange, includeFarms: false })
      );
    });

    it('should return a list of mex pairs from unknown source', async () => {
      mexPairServiceMocks.getMexPairs.mockReturnValue([]);
      const queryPagination = new QueryPagination({ from: 0, size: 5 });

      await request(app.getHttpServer())
        .get(`${path}/pairs?size=${queryPagination.size}&exchange=${MexPairExchange.unknown}`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPairs).toHaveBeenCalledWith(
        0, 5, new MexPairsFilter({ exchange: MexPairExchange.unknown, includeFarms: false })
      );
    });

    it('should return total mex pairs count', async () => {
      mexPairServiceMocks.getMexPairsCount.mockReturnValue(10);
      await request(app.getHttpServer())
        .get(`${path}/pairs/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(10);
        });

      expect(mexPairServiceMocks.getMexPairsCount).toHaveBeenCalledWith(
        new MexPairsFilter({ exchange: undefined, includeFarms: false })
      );
    });

    it('should return total mex pairs count from exchange', async () => {
      mexPairServiceMocks.getMexPairsCount.mockReturnValue(5);
      await request(app.getHttpServer())
        .get(`${path}/pairs/count?exchange=${MexPairExchange.xexchange}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5);
        });

      expect(mexPairServiceMocks.getMexPairsCount).toHaveBeenCalledWith(
        new MexPairsFilter({ exchange: MexPairExchange.xexchange, includeFarms: false })
      );
    });

    it('should return total mex pairs count from unknown', async () => {
      mexPairServiceMocks.getMexPairsCount.mockReturnValue(5);
      await request(app.getHttpServer())
        .get(`${path}/pairs/count?exchange=${MexPairExchange.unknown}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5);
        });

      expect(mexPairServiceMocks.getMexPairsCount).toHaveBeenCalledWith(
        new MexPairsFilter({ exchange: MexPairExchange.unknown, includeFarms: false })
      );
    });

    it('should return mex pair based on basId and quoteId', async () => {
      mexPairServiceMocks.getMexPair.mockReturnValue({});
      const baseId = 'MEX-455c57';
      const quoteId = 'WEGLD-bd4d79';

      await request(app.getHttpServer())
        .get(`${path}/pairs/${baseId}/${quoteId}`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPair).toHaveBeenCalledWith(baseId, quoteId, false);
    });

    it('should return mex pairs with farms information', async () => {
      mexPairServiceMocks.getMexPairs.mockReturnValue([]);
      await request(app.getHttpServer())
        .get(`${path}/pairs?includeFarms=true`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPairs).toHaveBeenCalledWith(
        0, 25, new MexPairsFilter({ exchange: undefined, includeFarms: true })
      );
    });

    it('should return mex pair with farms information', async () => {
      mexPairServiceMocks.getMexPair.mockReturnValue({});
      const baseId = 'MEX-455c57';
      const quoteId = 'WEGLD-bd4d79';

      await request(app.getHttpServer())
        .get(`${path}/pairs/${baseId}/${quoteId}?includeFarms=true`)
        .expect(200);

      expect(mexPairServiceMocks.getMexPair).toHaveBeenCalledWith(baseId, quoteId, true);
    });

    it('should return total mex pairs count with farms information', async () => {
      mexPairServiceMocks.getMexPairsCount.mockReturnValue(10);
      await request(app.getHttpServer())
        .get(`${path}/pairs/count?includeFarms=true`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(10);
        });

      expect(mexPairServiceMocks.getMexPairsCount).toHaveBeenCalledWith(
        new MexPairsFilter({ exchange: undefined, includeFarms: true })
      );
    });
  });

  describe('GET /mex/tokens', () => {
    it('should return a list of tokens', async () => {
      mexTokensServiceMocks.getMexTokens.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}/tokens`)
        .expect(200);

      expect(mexTokensServiceMocks.getMexTokens).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 })
      );
    });

    it('should return a list of 5 tokens', async () => {
      mexTokensServiceMocks.getMexTokens.mockReturnValue([]);
      const queryPagination = new QueryPagination();

      await request(app.getHttpServer())
        .get(`${path}/tokens?size=${queryPagination.size = 5}`)
        .expect(200);

      expect(mexTokensServiceMocks.getMexTokens).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 5 })
      );
    });

    it('should return total mex tokens count', async () => {
      mexTokensServiceMocks.getMexTokensCount.mockReturnValue(100);

      await request(app.getHttpServer())
        .get(`${path}/tokens/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(100);
        });

      expect(mexTokensServiceMocks.getMexTokensCount).toHaveBeenCalled();
    });

    it('should return mex token details for a given token identifier', async () => {
      mexTokensServiceMocks.getMexTokenByIdentifier.mockReturnValue({});
      const mexTokenIdentifier = 'MEX-455c57';

      await request(app.getHttpServer())
        .get(`${path}/tokens/${mexTokenIdentifier}`)
        .expect(200);

      expect(mexTokensServiceMocks.getMexTokenByIdentifier).toHaveBeenCalledWith(mexTokenIdentifier);
    });

    it('should thorow 400 Bad Request for a given invalid token identifier', async () => {
      mexTokensServiceMocks.getMexTokenByIdentifier.mockReturnValue({});
      const mexTokenIdentifier = 'MEX-455c57-Invalid';

      await request(app.getHttpServer())
        .get(`${path}/tokens/${mexTokenIdentifier}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'identifier': Invalid token identifier.");
        });
    });
  });

  describe('GET /mex/farms', () => {
    it('should return a list of mex farms', async () => {
      mexFarmsServiceMocks.getMexFarms.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}/farms`)
        .expect(200);

      expect(mexFarmsServiceMocks.getMexFarms).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 })
      );
    });

    it('should return a list of 5 mex farms', async () => {
      mexFarmsServiceMocks.getMexFarms.mockReturnValue([]);
      const queryPagination = new QueryPagination();

      await request(app.getHttpServer())
        .get(`${path}/farms?size=${queryPagination.size = 5}`)
        .expect(200);

      expect(mexFarmsServiceMocks.getMexFarms).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 5 })
      );
    });

    it('should return total mex farms count', async () => {
      mexFarmsServiceMocks.getMexFarmsCount.mockReturnValue(10);

      await request(app.getHttpServer())
        .get(`${path}/farms/count`)
        .expect(200);

      expect(mexFarmsServiceMocks.getMexFarmsCount).toHaveBeenCalled();
    });
  });
});
