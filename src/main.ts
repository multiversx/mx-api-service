import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ApiConfigService } from './helpers/api.config.service';
import { CachingService } from './helpers/caching.service';
import { CachingInterceptor } from './interceptors/caching.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  let apiConfigService = app.get<ApiConfigService>(ApiConfigService);
  let cachingService = app.get<CachingService>(CachingService);
  let httpAdapterHostService = app.get<HttpAdapterHost>(HttpAdapterHost);

  app.useGlobalInterceptors(
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
