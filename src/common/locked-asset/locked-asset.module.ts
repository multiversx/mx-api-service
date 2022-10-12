import { Module } from '@nestjs/common';
import { LockedAssetService } from './locked-asset.service';
import { VmQueryModule } from '../../endpoints/vm.query/vm.query.module';
import { MexModule } from 'src/endpoints/mex/mex.module';

@Module({
  imports: [
    VmQueryModule,
    MexModule,
  ],
  providers: [
    LockedAssetService,
  ],
  exports: [
    LockedAssetService,
  ],
})
export class LockedAssetModule { }
