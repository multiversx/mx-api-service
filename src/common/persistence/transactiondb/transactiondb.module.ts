import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ApiConfigModule } from "../../api-config/api.config.module";
import { ApiConfigService } from "../../api-config/api.config.service";
import { TransactionDbService } from "./transactiondb.service";
import {
  TransactionDb,
} from "./entities/transaction.db.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: 'mongodb',
          entities: [TransactionDb],
          url: apiConfigService.getDatabaseUrl(),
          keepAlive: 120000,
          sslValidate: false,
          retryAttempts: 300,
          useUnifiedTopology: true,
          autoLoadEntities: true,
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([TransactionDb]),
  ],
  providers: [TransactionDbService],
  exports: [TransactionDbService, TypeOrmModule.forFeature([TransactionDb])],
})
export class TransactionDbModule { }
