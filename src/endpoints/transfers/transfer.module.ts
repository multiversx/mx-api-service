import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { TokenModule } from "../tokens/token.module";
import { TransactionModule } from "../transactions/transaction.module";
import { TransferService } from "./transfer.service";


@Module({
  imports: [
    forwardRef(() => TransactionModule),
    forwardRef(() => TokenModule),
    AssetsModule,
  ],
  providers: [
    TransferService,
  ],
  exports: [
    TransferService,
  ],
})
export class TransferModule { }
