import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PublicAppModule } from './public.app.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ApiConfigService } from './helpers/api.config.service';
import { CachingService } from './helpers/caching.service';
import { CachingInterceptor } from './interceptors/caching.interceptor';
import { PrivateAppModule } from './private.app.module';
import { TransactionProcessorModule } from './transaction.processor.module';
import { MetricsService } from './endpoints/metrics/metrics.service';
import { CacheWarmerModule } from './cache.warmer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PubSubModule } from './pub.sub.module';
import * as bodyParser from 'body-parser';
import { Logger } from '@nestjs/common';
import * as requestIp from 'request-ip';

async function bootstrap() {
  const publicApp = await NestFactory.create(PublicAppModule);
  publicApp.use(bodyParser.json({limit: '1mb'}));
  publicApp.use(requestIp.mw());
  publicApp.enableCors();

  let apiConfigService = publicApp.get<ApiConfigService>(ApiConfigService);
  let cachingService = publicApp.get<CachingService>(CachingService);
  let httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost);
  let metricsService = publicApp.get<MetricsService>(MetricsService);

  publicApp.useGlobalInterceptors(
    new LoggingInterceptor(metricsService), 
    new CachingInterceptor(cachingService, httpAdapterHostService, metricsService)
  );
  const description = readFileSync(join(__dirname, '..', 'docs', 'swagger.md'), 'utf8');

  const config = new DocumentBuilder()
    .setTitle('Elrond API')
    .setDescription(description)
    .setVersion('1.0.0')
    .addServer('http://localhost:3001')
    .addServer('http://138.68.110.168:3001')
    .addServer('https://api.elrond.com')
    .addServer('https://devnet-api.elrond.com')
    .addServer('https://testnet-api.elrond.com')
    .setExternalDoc('Elrond Docs', 'https://docs.elrond.com')
    .build();

  const document = SwaggerModule.createDocument(publicApp, config);
  SwaggerModule.setup('docs', publicApp, document);

  if (apiConfigService.getIsPublicApiActive()) {
    await publicApp.listen(3001);
  }

  if (apiConfigService.getIsPrivateApiActive()) {
    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(4001);
  }

  if (apiConfigService.getIsTransactionProcessorCronActive()) {
    let processorApp = await NestFactory.create(TransactionProcessorModule);
    await processorApp.listen(5001);
  }

  if (apiConfigService.getIsCacheWarmerCronActive()) {
    let processorApp = await NestFactory.create(CacheWarmerModule);
    await processorApp.listen(6001);
  }

  let logger = new Logger('Bootstrapper');

  const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    PubSubModule,
    {
      transport: Transport.REDIS,
      options: {
        url: `redis://${apiConfigService.getRedisUrl()}:6379`,
      }
    },
  );
  pubSubApp.listen(() => logger.log('Started Redis pub/sub microservice'));

  logger.log(`Public API active: ${apiConfigService.getIsPublicApiActive()}`);
  logger.log(`Private API active: ${apiConfigService.getIsPublicApiActive()}`);
  logger.log(`Transaction processor active: ${apiConfigService.getIsTransactionProcessorCronActive()}`);
  logger.log(`Cache warmer active: ${apiConfigService.getIsCacheWarmerCronActive()}`);
}
bootstrap();
