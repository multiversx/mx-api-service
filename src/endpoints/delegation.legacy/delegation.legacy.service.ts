import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { DelegationLegacy } from "./entities/delegation.legacy";
import { AccountDelegationLegacy } from "./entities/account.delegation.legacy";
import { AddressUtils, CachingService } from "@elrondnetwork/erdnest-common";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class DelegationLegacyService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) { }

  async getDelegation(): Promise<DelegationLegacy> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.DelegationLegacy.key,
      async () => await this.getDelegationRaw(),
      CacheInfo.DelegationLegacy.ttl,
    );
  }

  async getDelegationRaw(): Promise<DelegationLegacy> {
    const [totalStakeByTypeEncoded, numUsersEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getTotalStakeByType',
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getNumUsers',
      ),
    ]);

    const [
      totalWithdrawOnlyStake,
      totalWaitingStake,
      totalActiveStake,
      totalUnstakedStake,
      totalDeferredPaymentStake,
    ] = totalStakeByTypeEncoded.map((encoded) => this.numberDecode(encoded));

    const numUsers = Number(this.numberDecode(numUsersEncoded[0]));

    return {
      totalWithdrawOnlyStake,
      totalWaitingStake,
      totalActiveStake,
      totalUnstakedStake,
      totalDeferredPaymentStake,
      numUsers,
    };
  }

  async getDelegationForAddress(address: string): Promise<AccountDelegationLegacy> {
    const publicKey = AddressUtils.bech32Decode(address);

    const [userStakeByTypeEncoded, claimableRewardsEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getUserStakeByType',
        undefined,
        [publicKey]
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getClaimableRewards',
        undefined,
        [publicKey]
      ),
    ]);

    const [
      userWithdrawOnlyStake,
      userWaitingStake,
      userActiveStake,
      userUnstakedStake,
      userDeferredPaymentStake,
    ] = userStakeByTypeEncoded.map((encoded) => this.numberDecode(encoded));

    const claimableRewards = this.numberDecode(claimableRewardsEncoded[0]);

    return {
      userWithdrawOnlyStake,
      userWaitingStake,
      userActiveStake,
      userUnstakedStake,
      userDeferredPaymentStake,
      claimableRewards,
    };
  }

  numberDecode(encoded: string) {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  }
}
