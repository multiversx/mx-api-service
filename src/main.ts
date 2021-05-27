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
import { ProcessorModule } from './processor.module';

async function bootstrap() {
  const publicApp = await NestFactory.create(PublicAppModule);
  publicApp.enableCors();

  let apiConfigService = publicApp.get<ApiConfigService>(ApiConfigService);
  let cachingService = publicApp.get<CachingService>(CachingService);
  let httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost);

  publicApp.useGlobalInterceptors(
    new LoggingInterceptor(apiConfigService, cachingService), 
    new CachingInterceptor(cachingService, httpAdapterHostService)
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
  SwaggerModule.setup('api', publicApp, document);

  if (apiConfigService.getIsApiActive()) {
    await publicApp.listen(3001);

    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(4001);
  }

  if (apiConfigService.getIsCronActive()) {
    let processorModule = await NestFactory.create(ProcessorModule);
    await processorModule.listen(5001);
  }
}
bootstrap();
