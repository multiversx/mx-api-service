import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { DelegationLegacy } from "./entities/delegation.legacy";
import { AccountDelegationLegacy } from "./entities/account.delegation.legacy";
import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class DelegationLegacyService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
  ) { }

  async getDelegation(): Promise<DelegationLegacy> {
    return await this.cachingService.getOrSet(
      CacheInfo.DelegationLegacy.key,
      async () => await this.getDelegationRaw(),
      CacheInfo.DelegationLegacy.ttl,
    );
  }

  async getDelegationRaw(): Promise<DelegationLegacy> {
    const delegationContractAddress = this.apiConfigService.getDelegationContractAddress();
    if (!delegationContractAddress) {
      return new DelegationLegacy();
    }

    const [totalStakeByTypeEncoded, numUsersEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        delegationContractAddress,
        'getTotalStakeByType',
      ),
      this.vmQueryService.vmQuery(
        delegationContractAddress,
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
    const delegationContractAddress = this.apiConfigService.getDelegationContractAddress();
    if (!delegationContractAddress) {
      return new AccountDelegationLegacy();
    }

    const publicKey = AddressUtils.bech32Decode(address);

    const [userStakeByTypeEncoded, claimableRewardsEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        delegationContractAddress,
        'getUserStakeByType',
        undefined,
        [publicKey]
      ),
      this.vmQueryService.vmQuery(
        delegationContractAddress,
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
    ] = userStakeByTypeEncoded ? userStakeByTypeEncoded.map((encoded) => this.numberDecode(encoded)) : 
      ['0', '0', '0', '0', '0'];

    const claimableRewards = claimableRewardsEncoded ? this.numberDecode(claimableRewardsEncoded[0]) : '0';

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
