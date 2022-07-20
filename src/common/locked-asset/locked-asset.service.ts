import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { LockedAssetAttributes, UnlockMilestone } from '@elrondnetwork/erdjs-dex';
import { ApiConfigService } from '../api-config/api.config.service';
import { VmQueryService } from '../../endpoints/vm.query/vm.query.service';
import { CacheInfo } from '../../utils/cache.info';
import { CachingService, Constants } from '@elrondnetwork/erdnest';
import { UnlockMileStoneModel } from '../entities/unlock-schedule';
import { TokenUtils } from '../../utils/token.utils';
import { GatewayComponentRequest } from '../gateway/entities/gateway.component.request';
import { GatewayService } from '../gateway/gateway.service';
import { MexSettingsService } from 'src/endpoints/mex/mex.settings.service';

@Injectable()
export class LockedAssetService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  async getUnlockSchedule(identifier: string, attributes: string): Promise<UnlockMileStoneModel[] | undefined> {
    const hasUnlockSchedule = await this.hasUnlockSchedule(identifier);
    if (!hasUnlockSchedule) {
      return undefined;
    }

    const extendedAttributesActivationNonce = await this.getExtendedAttributesActivationNonce();
    const withActivationNonce = TokenUtils.tokenNonce(identifier) >= extendedAttributesActivationNonce;
    const lockedAssetAttributes = LockedAssetAttributes.fromAttributes(withActivationNonce, attributes);

    if (!lockedAssetAttributes.unlockSchedule) {
      return undefined;
    }

    return await this.getUnlockMilestones(lockedAssetAttributes.unlockSchedule, withActivationNonce);
  }

  private async hasUnlockSchedule(collection: string): Promise<boolean> {
    const lockedTokenId = await this.getLockedTokenId();
    return collection.startsWith(lockedTokenId);
  }

  private async getExtendedAttributesActivationNonce(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.ExtendedAttributesActivationNonce.key,
      async () => await this.getExtendedAttributesActivationNonceRaw(),
      Constants.oneWeek(),
      CacheInfo.ExtendedAttributesActivationNonce.ttl
    );
  }

  private async getExtendedAttributesActivationNonceRaw(): Promise<number> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      return 0;
    }

    const [encoded] = await this.vmQueryService.vmQuery(
      settings.lockedAssetContract,
      'getExtendedAttributesActivationNonce',
      undefined,
      []
    );

    if (!encoded) {
      return 0;
    }

    const nonce = Buffer.from(encoded, 'base64').toString('hex');
    return parseInt(nonce, 16);
  }

  private async getInitEpoch(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.InitEpoch.key,
      async () => await this.getInitEpochRaw(),
      Constants.oneWeek(),
      CacheInfo.InitEpoch.ttl
    );
  }

  private async getInitEpochRaw(): Promise<number> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      return 0;
    }

    const [encoded] = await this.vmQueryService.vmQuery(
      settings.lockedAssetContract,
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

  private lockedTokenId: string | undefined;

  private async getLockedTokenId(): Promise<string> {
    if (this.lockedTokenId) {
      return this.lockedTokenId;
    }

    const lockedTokenId = await this.cachingService.getOrSetCache(
      CacheInfo.LockedTokenID.key,
      async () => await this.getLockedTokenIdRaw(),
      CacheInfo.LockedTokenID.ttl,
    );

    this.lockedTokenId = lockedTokenId;

    return lockedTokenId;
  }

  private async getLockedTokenIdRaw(): Promise<string> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      return '';
    }

    return settings.lockedAssetIdentifier;
  }

  private async getUnlockMilestones(unlockSchedule: UnlockMilestone[], withActivationNonce: boolean): Promise<UnlockMileStoneModel[]> {
    const unlockMilestones: UnlockMileStoneModel[] = [];
    for (const unlockMilestone of unlockSchedule) {
      // @ts-ignore
      const epoch: BigNumber = unlockMilestone.epoch;
      // @ts-ignore
      const percent: BigNumber = unlockMilestone.percent;

      const PRECISION_EX_INCREASE = 1000;
      const unlockPercent = withActivationNonce ? percent.div(PRECISION_EX_INCREASE) : percent;
      const remainingEpochs = await this.getRemainingEpochs(epoch.toNumber());

      const milestone = new UnlockMileStoneModel({
        percent: unlockPercent.toNumber(),
        epoch: remainingEpochs > 0 ? remainingEpochs : 0,
      });

      unlockMilestones.push(milestone);
    }

    return unlockMilestones;
  }

  private async getRemainingEpochs(unlockEpoch: number): Promise<number> {
    const [currentEpoch, unlockStartEpoch] = await Promise.all([
      this.getCurrentEpochCached(),
      this.getMonthStartEpoch(unlockEpoch),
    ]);
    if (unlockEpoch <= unlockStartEpoch && unlockEpoch <= currentEpoch) {
      return 0;
    } else {
      return unlockStartEpoch + 30 - currentEpoch;
    }
  }

  private async getMonthStartEpoch(unlockEpoch: number): Promise<number> {
    const initEpoch = await this.getInitEpoch();
    return unlockEpoch - ((unlockEpoch - initEpoch) % 30);
  }

  private async getCurrentEpochCached(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.CurrentEpoch.key,
      async () => await this.getCurrentEpoch(),
      Constants.oneMinute(),
      CacheInfo.CurrentEpoch.ttl
    );
  }

  private async getCurrentEpoch(): Promise<number> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();
    const res = await this.gatewayService.get(`network/status/${metaChainShard}`, GatewayComponentRequest.networkStatus);
    return res.status.erd_epoch_number;
  }
}
