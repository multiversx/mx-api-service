import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { LockedAssetAttributes } from '@elrondnetwork/erdjs-dex';
import { ApiConfigService } from '../api-config/api.config.service';
import { VmQueryService } from '../../endpoints/vm.query/vm.query.service';
import { CacheInfo } from '../../utils/cache.info';
import { CachingService, Constants } from '@elrondnetwork/erdnest';
import { UnlockMileStoneModel } from '../entities/unlock-schedule';
import { TokenUtils } from '../../utils/token.utils';
import { GatewayComponentRequest } from '../gateway/entities/gateway.component.request';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class LockedAssetService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
  ) {}

  async getUnlockSchedule(
    collection: string,
    identifier: string,
    attributes: string,
  ): Promise<UnlockMileStoneModel[]> {
    if (!await this.hasUnlockSchedule(collection)) {
      return [];
    }
    const extendedAttributesActivationNonce = await this.getExtendedAttributesActivationNonceCached();
    const withActivationNonce =
      TokenUtils.tokenNonce(identifier) >=
      extendedAttributesActivationNonce;
    const lockedAssetAttributes = LockedAssetAttributes.fromAttributes(
      withActivationNonce,
      attributes,
    );
    return await this.getUnlockMilestones(
      lockedAssetAttributes.unlockSchedule,
      withActivationNonce,
    );
  }

  private async hasUnlockSchedule(collection: string): Promise<boolean> {
    const lockedMEXTokenID = await this.getLockedTokenIDCached();
    return collection === lockedMEXTokenID;
  }

  private async getExtendedAttributesActivationNonceCached(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.ExtendedAttributesActivationNonce.key,
      async () => await this.getExtendedAttributesActivationNonce(),
      Constants.oneWeek(),
      CacheInfo.ExtendedAttributesActivationNonce.ttl
    );
  }

  private async getExtendedAttributesActivationNonce(): Promise<number> {
    const [encoded] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getLockedAssetAddress(),
      'getExtendedAttributesActivationNonce',
      undefined,
      []
    );

    if (!encoded) {
      return 0;
    }

    const nonce = Buffer.from(encoded, 'base64').toString('hex');
    return parseInt(nonce,  16);
  }

  private async getInitEpochCached(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.InitEpoch.key,
      async () => await this.getInitEpoch(),
      Constants.oneWeek(),
      CacheInfo.InitEpoch.ttl
    );
  }

  private async getInitEpoch(): Promise<number> {
    const [encoded] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getLockedAssetAddress(),
      'getInitEpoch',
      undefined,
      []
    );

    if (!encoded) {
      return 0;
    }

    const epoch = Buffer.from(encoded, 'base64').toString('hex');
    return parseInt(epoch, 16);
  }

  private async getLockedTokenIDCached(): Promise<string> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.LockedTokenID.key,
      async () => await this.getLockedTokenID(),
      Constants.oneDay(),
      CacheInfo.LockedTokenID.ttl
    );
  }

  private async getLockedTokenID(): Promise<string> {
    const [encoded] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getLockedAssetAddress(),
      'getLockedAssetTokenId',
      undefined,
      []
    );

    if (!encoded) {
      return '';
    }

    return Buffer.from(encoded, 'base64').toString();
  }

  private async getUnlockMilestones(
    unlockSchedule: any,
    withActivationNonce: boolean,
  ): Promise<UnlockMileStoneModel[]> {
    const unlockMilestones: UnlockMileStoneModel[] = [];
    for (const unlockMilestone of unlockSchedule) {
      const unlockEpoch = unlockMilestone.epoch.toNumber();
      const unlockPercent: BigNumber = withActivationNonce
        ? unlockMilestone.percent.div(
          this.apiConfigService.getPrecisionExIncrease(),
        )
        : unlockMilestone.percent;
      const remainingEpochs = await this.getRemainingEpochs(unlockEpoch);

      unlockMilestones.push(
        new UnlockMileStoneModel({
          percent: unlockPercent.toNumber(),
          epochs: remainingEpochs > 0 ? remainingEpochs : 0,
        }),
      );
    }

    return unlockMilestones;
  }

  private async getRemainingEpochs(unlockEpoch: number): Promise<number> {
    const [currentEpoch, unlockStartEpoch] = await Promise.all([
      this.getCurrentEpoch(),
      this.getMonthStartEpoch(unlockEpoch),
    ]);
    if (unlockEpoch <= unlockStartEpoch && unlockEpoch <= currentEpoch) {
      return 0;
    } else {
      return unlockStartEpoch + 30 - currentEpoch;
    }
  }

  private async getMonthStartEpoch(unlockEpoch: number): Promise<number> {
    const initEpoch = await this.getInitEpochCached();
    return unlockEpoch - ((unlockEpoch - initEpoch) % 30);
  }

  private async getCurrentEpoch(): Promise<number> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();
    const res = await this.gatewayService.get(`network/status/${metaChainShard}`, GatewayComponentRequest.networkStatus);
    return res.status.erd_epoch_number;
  }
}
