import { Injectable } from "@nestjs/common";
import { DelegationLegacy } from "./entities/delegation.legacy";
import { AccountDelegationLegacy } from "./entities/account.delegation.legacy";
import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { DelegationContractService } from "../vm.query/contracts/delegation.contract.service";

@Injectable()
export class DelegationLegacyService {
  constructor(
    private readonly cachingService: CacheService,
    private readonly delegationContractService: DelegationContractService,
  ) { }

  async getDelegation(): Promise<DelegationLegacy> {
    return await this.cachingService.getOrSet(
      CacheInfo.DelegationLegacy.key,
      async () => await this.getDelegationRaw(),
      CacheInfo.DelegationLegacy.ttl,
    );
  }

  async getDelegationRaw(): Promise<DelegationLegacy> {
    const [totalStakeByTypeEncoded, numUsersEncoded] = await Promise.all([
      this.delegationContractService.getTotalStakeByType(),
      this.delegationContractService.getNumUsers(),
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
      this.delegationContractService.getUserStakeByType(publicKey),
      this.delegationContractService.getClaimableRewards(publicKey),
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
