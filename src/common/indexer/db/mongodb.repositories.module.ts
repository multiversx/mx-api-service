import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountDetails, AccountDetailsSchema } from "./schemas";
import { AccountDetailsRepository } from "./repositories";


@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AccountDetails.name, schema: AccountDetailsSchema },
        ]),
    ],
    providers: [
        AccountDetailsRepository,
    ],
    exports: [
        AccountDetailsRepository,
    ],
})
export class MongoDbRepositoriesModule { }
