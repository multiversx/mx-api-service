import { Global, Module } from '@nestjs/common';
import { LockedAssetService } from './locked-asset.service';
import { VmQueryModule } from '../../endpoints/vm.query/vm.query.module';

@Global()
@Module({
  imports: [
    VmQueryModule,
  ],
  providers: [
    LockedAssetService,
  ],
  exports: [
    LockedAssetService,
  ],
})
export class lockedAssetModule { }
