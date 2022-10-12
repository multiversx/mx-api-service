import { forwardRef, Global, Module } from "@nestjs/common";
import { IndexerModule } from "src/common/indexer/indexer.module";
import { BlsService } from "./bls.service";

@Global()
@Module({
  imports: [
    forwardRef(() => IndexerModule.register()),
  ],
  providers: [
    BlsService,
  ],
  exports: [
    BlsService,
  ],
})
export class BlsModule { }
