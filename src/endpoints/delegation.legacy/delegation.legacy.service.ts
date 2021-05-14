import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { bech32Decode } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { DelegationLegacy } from "./entities/delegation.legacy";

@Injectable()
export class DelegationLegacyService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
  ) {}

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

  async getDelegationForAddress(address: string): Promise<DelegationLegacy> {
    const publicKey = bech32Decode(address);

    const [totalStakeByTypeEncoded, numUsersEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getTotalStakeByType',
        undefined,
        [ publicKey ]
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getNumUsers',
        undefined,
        [ publicKey ]
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

  numberDecode(encoded: string) {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  };
}