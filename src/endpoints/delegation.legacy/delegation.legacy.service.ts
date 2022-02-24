import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { DelegationLegacy } from "./entities/delegation.legacy";
import { AccountDelegationLegacy } from "./entities/account.delegation.legacy";
import { AddressUtils } from "src/utils/address.utils";

@Injectable()
export class DelegationLegacyService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
  ) { }

  async getDelegation(): Promise<DelegationLegacy> {
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

    const numUsers = this.numberDecode(numUsersEncoded[0]);

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
        undefined,
        [publicKey]
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getClaimableRewards',
        undefined,
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
