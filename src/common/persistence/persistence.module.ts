import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import configuration from "config/configuration";
import { MongoDbModule } from "./mongodb/mongo.db.module";
import { MongoDbService } from "./mongodb/mongo.db.service";
import { PassThroughModule } from "./passthrough/pass.through.module";
import { PassThroughService } from "./passthrough/pass.through.service";
import { PersistenceInterface } from "./persistence.interface";
import { PersistenceService } from "./persistence.service";
import { UserDbService } from "./userdb/user.db.service";
import { UserDbModule } from "./userdb/user.db.module";
import { TransactionDbService } from "./transactiondb/transactiondb.service";
import { TransactionDbModule } from "./transactiondb/transactiondb.module";

@Global()
@Module({})
export class PersistenceModule {
  static register(): DynamicModule {
    let persistenceModule: Type<any> = PassThroughModule;
    let persistenceInterface: Type<PersistenceInterface> = PassThroughService;

    const isPassThrough = process.env.PERSISTENCE === 'passthrough' || configuration().database?.enabled === false;
    if (!isPassThrough) {
      persistenceModule = MongoDbModule;
      persistenceInterface = MongoDbService;
    }

    return {
      module: PersistenceModule,
      imports: [
        persistenceModule,
        UserDbModule,
        TransactionDbModule,
      ],
      providers: [
        {
          provide: 'PersistenceInterface',
          useClass: persistenceInterface,
        },
        PersistenceService,
        UserDbService,
        TransactionDbService,
      ],
      exports: ['PersistenceInterface', PersistenceService, UserDbService, TransactionDbService],
    };
  }
}
