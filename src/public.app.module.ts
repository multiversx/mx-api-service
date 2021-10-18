import { forwardRef, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
const DailyRotateFile = require('winston-daily-rotate-file');
import "./utils/extensions/array.extensions";
import "./utils/extensions/date.extensions";
import "./utils/extensions/number.extensions";
import { CommonModule } from './common/common.module';
import { EndpointsModule } from  './endpoints/enpoints.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'verbose',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.Console({ level: 'info' }),
        new DailyRotateFile({
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          createSymlink: true,
          dirname: 'dist/logs',
          symlinkName: 'application.log'
        }),
      ]
    }),
    forwardRef(() => CommonModule),
    forwardRef(() => EndpointsModule),
  ],
  exports: [
    CommonModule,
    EndpointsModule,
  ]
})
export class PublicAppModule { }
