import { Module } from "@nestjs/common";
import { TransferModule as InternalTransferModule } from "src/endpoints/transfers/transfer.module";
import { TransferResolver } from "./transfers.resolver";

@Module({
  imports: [InternalTransferModule],
  providers: [TransferResolver],
})
export class TransferModule { }
