import { Injectable } from '@nestjs/common';
import { LockedAssetAttributes, UnlockMilestone, LockedTokenAttributes } from '@elrondnetwork/erdjs-dex';
import { ApiConfigService } from '../api-config/api.config.service';
import { VmQueryService } from '../../endpoints/vm.query/vm.query.service';
import { CacheInfo } from '../../utils/cache.info';
import { CachingService, Constants } from '@elrondnetwork/erdnest';
import { TokenHelpers } from '../../utils/token.helpers';
import { GatewayComponentRequest } from '../gateway/entities/gateway.component.request';
import { GatewayService } from '../gateway/gateway.service';
import { MexSettingsService } from 'src/endpoints/mex/mex.settings.service';
import { LockedTokensInterface } from './entities/locked.tokens.interface';
import { UnlockMileStoneModel } from './entities/unlock.milestone.model';

@Injectable()
export class LockedAssetService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  async getLkmexUnlockSchedule(identifier: string, attributes: string): Promise<UnlockMileStoneModel[] | undefined> {
    const lockedTokenIds = await this.getLockedTokens();
    if (!lockedTokenIds) {
      return undefined;
    }

    if (!identifier.startsWith(lockedTokenIds.lkmex)) {
      return undefined;
    }

    const extendedAttributesActivationNonce = await this.getExtendedAttributesActivationNonce();
    const withActivationNonce = TokenHelpers.tokenNonce(identifier) >= extendedAttributesActivationNonce;
    const lockedAssetAttributes = LockedAssetAttributes.fromAttributes(withActivationNonce, attributes);

    if (!lockedAssetAttributes.unlockSchedule) {
      return undefined;
    }

    return await this.getUnlockMilestones(lockedAssetAttributes.unlockSchedule, withActivationNonce);
  }

  async getXmexUnlockEpoch(identifier: string, attributes: string): Promise<number | undefined> {
    const lockedTokenIds = await this.getLockedTokens();
    if (!lockedTokenIds) {
      return undefined;
    }

    if (!identifier.startsWith(lockedTokenIds.xmex)) {
      return undefined;
    }

    const decodedAttributes = LockedTokenAttributes.fromAttributes(attributes);

    return decodedAttributes.unlockEpoch;
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

  private lockedTokenIds: LockedTokensInterface | undefined;

  private async getLockedTokens(): Promise<LockedTokensInterface | undefined> {
    if (this.lockedTokenIds) {
      return this.lockedTokenIds;
    }

    const lockedTokenIds = await this.cachingService.getOrSetCache(
      CacheInfo.LockedTokenIDs.key,
      async () => await this.getLockedTokensRaw(),
      CacheInfo.LockedTokenIDs.ttl,
    );

    this.lockedTokenIds = lockedTokenIds;

    return lockedTokenIds;
  }

  private async getLockedTokensRaw(): Promise<LockedTokensInterface> {
    const settings = await this.mexSettingsService.getSettings();
    if (!settings) {
      return {
        lkmex: '',
        xmex: '',
      };
    }

    return {
      lkmex: settings.lockedAssetIdentifier,
      xmex: settings.lockedAssetIdentifierV2,
    };
  }

  private async getUnlockMilestones(unlockSchedule: UnlockMilestone[], withActivationNonce: boolean): Promise<UnlockMileStoneModel[]> {
    const unlockMilestones: UnlockMileStoneModel[] = [];
    const aggregatedMilestones: Record<number, number> = {};
    const PRECISION_EX_INCREASE = 1000;

    for (const unlockMilestone of unlockSchedule) {
      const epoch = unlockMilestone.epoch.toNumber();
      const percent = withActivationNonce ? unlockMilestone.percent.div(PRECISION_EX_INCREASE) : unlockMilestone.percent;

      let remainingEpochs = await this.getRemainingEpochs(epoch);
      remainingEpochs = remainingEpochs > 0 ? remainingEpochs : 0;

      if (!aggregatedMilestones[remainingEpochs]) {
        aggregatedMilestones[remainingEpochs] = 0;
      }

      aggregatedMilestones[remainingEpochs] += percent.toNumber();
    }

    for (const epoch of Object.keys(aggregatedMilestones)) {
      const milestone = new UnlockMileStoneModel({
        remainingEpochs: Number(epoch),
        percent: aggregatedMilestones[Number(epoch)],
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
