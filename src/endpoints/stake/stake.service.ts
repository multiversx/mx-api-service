import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { NodeType } from "../nodes/entities/node.type";
import { NodeService } from "../nodes/node.service";
import { Stake } from "./entities/stake";
import { StakeTopup } from "./entities/stake.topup";
import { NetworkService } from "../network/network.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { CacheInfo } from "src/utils/cache.info";
import { AddressUtils, RoundUtils } from "@multiversx/sdk-nestjs-common";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ProviderStake } from "./entities/provider.stake";

@Injectable()
export class StakeService {
  private logger = new OriginLogger(StakeService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => NetworkService))
    private readonly networkService: NetworkService,
  ) { }

  async getGlobalStake() {
    return await this.cachingService.getOrSet(
      CacheInfo.GlobalStake.key,
      async () => await this.getGlobalStakeRaw(),
      CacheInfo.GlobalStake.ttl
    );
  }

  async getGlobalStakeRaw() {
    const [
      validators,
      {
        erd_total_base_staked_value: totalBaseStaked,
        erd_total_top_up_value: totalTopUp,
      },
    ] = await Promise.all([this.getValidators(), this.gatewayService.getNetworkEconomics()]);

    const totalStaked = BigInt(BigInt(totalBaseStaked) + BigInt(totalTopUp)).toString();

    return { ...validators, totalStaked };
  }

  async getValidators() {
    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return {
        totalValidators: 0,
        activeValidators: 0,
        queueSize: 0,
      };
    }

    const [[queueSize], nodes] = await Promise.all([
      this.vmQueryService.vmQuery(
        stakingContractAddress,
        'getQueueSize',
      ),
      this.nodeService.getAllNodes(),
    ]);

    return {
      totalValidators: nodes.filter(
        ({ type, status }) => type === NodeType.validator && [NodeStatus.eligible, NodeStatus.waiting].includes(status ?? NodeStatus.unknown)
      ).length,
      activeValidators: nodes.filter(
        ({ type, status, online }) =>
          type === NodeType.validator && [NodeStatus.eligible, NodeStatus.waiting].includes(status ?? NodeStatus.unknown) && online === true
      ).length,
      queueSize: parseInt(Buffer.from(queueSize, 'base64').toString()),
    };
  }

  async getStakes(addresses: string[]): Promise<Stake[]> {
    const stakesForAddressesNodes = await this.getAllStakesForNodes(addresses);

    const allStakesForAddresses: Stake[] = [];
    for (const stake of stakesForAddressesNodes) {
      const blses = stake.blses;
      if (!blses) {
        this.logger.error(`Cannot find blses for address stake '${stake.address}'`);
      }

      for (const bls of blses) {
        const nodeStake = ApiUtils.mergeObjects(new Stake(), stake);
        nodeStake.bls = bls;

        allStakesForAddresses.push(nodeStake);
      }
    }

    return allStakesForAddresses;
  }

  async getAllStakesForNode(address: string) {
    return await this.cachingService.getOrSet(
      CacheInfo.StakeTopup(address).key,
      async () => await this.getAllStakesForAddressNodesRaw(address),
      CacheInfo.StakeTopup(address).ttl
    );
  }

  async getAllStakesForNodes(addresses: string[]) {
    return await this.cachingService.batchProcess(
      addresses,
      address => CacheInfo.StakeTopup(address).key,
      async address => await this.getAllStakesForAddressNodesRaw(address),
      CacheInfo.StakeTopup('').ttl
    );
  }

  async getAllStakesForAddressNodesRaw(address: string): Promise<StakeTopup> {
    if (!address) {
      return new StakeTopup();
    }

    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return new StakeTopup();
    }

    let response: string[] | undefined;
    try {
      response = await this.vmQueryService.vmQuery(
        auctionContractAddress,
        'getTotalStakedTopUpStakedBlsKeys',
        auctionContractAddress,
        [AddressUtils.bech32Decode(address)],
      );
    } catch (error) {
      this.logger.log(`Unexpected error when trying to get stake informations from contract for address '${address}'`);
      this.logger.log(error);
      response = undefined;
    }

    if (!response) {
      return {
        topUp: '0',
        stake: '0',
        locked: '0',
        numNodes: 0,
        address,
        blses: [],
      };
    }

    const [topUpBase64, stakedBase64, numNodesBase64, ...blsesBase64] = response || [];

    const topUpHex = Buffer.from(topUpBase64, 'base64').toString('hex');
    const totalTopUp = BigInt(topUpHex ? '0x' + topUpHex : topUpHex);

    const stakedHex = Buffer.from(stakedBase64, 'base64').toString('hex');
    const totalStaked = BigInt(stakedHex ? '0x' + stakedHex : stakedHex) - totalTopUp;

    const totalLocked = totalStaked + totalTopUp;

    const numNodesHex = Buffer.from(numNodesBase64, 'base64').toString('hex');
    const numNodes = BigInt(numNodesHex ? '0x' + numNodesHex : numNodesHex);

    const blses = blsesBase64.map((nodeBase64) => Buffer.from(nodeBase64, 'base64').toString('hex'));

    if (totalStaked.toString() === '0' && numNodes.toString() === '0') {
      return {
        topUp: '0',
        stake: '0',
        locked: '0',
        numNodes: parseInt(numNodes.toString()),
        address,
        blses,
      };
    } else {
      const topUp = String(totalTopUp / numNodes);
      const stake = String(totalStaked / numNodes);
      const locked = String(totalLocked / numNodes);

      return {
        topUp,
        stake,
        locked,
        numNodes: parseInt(numNodes.toString()),
        address,
        blses,
      };
    }
  }

  async getStakeForAddress(address: string) {
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return new ProviderStake({
        totalStaked: '0',
      });
    }


    const hexAddress = AddressUtils.bech32Decode(address);

    const [totalStakedEncoded, unStakedTokensListEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        auctionContractAddress,
        'getTotalStaked',
        address,
      ),
      this.vmQueryService.vmQuery(
        auctionContractAddress,
        'getUnStakedTokensList',
        address,
        [hexAddress],
      ),
    ]);

    const data: any = {
      totalStaked: '0',
      unstakedTokens: undefined,
    };

    if (totalStakedEncoded) {
      data.totalStaked = Buffer.from(totalStakedEncoded[0], 'base64').toString('ascii');
    }

    if (unStakedTokensListEncoded) {
      data.unstakedTokens = unStakedTokensListEncoded.reduce((result: any, _, index, array) => {
        if (index % 2 === 0) {
          const [encodedAmount, encodedEpochs] = array.slice(index, index + 2);

          const amountHex = Buffer.from(encodedAmount, 'base64').toString('hex');
          const amount = BigInt(amountHex ? '0x' + amountHex : amountHex).toString();

          const epochsHex = Buffer.from(encodedEpochs, 'base64').toString('hex');
          const epochs = parseInt(BigInt(epochsHex ? '0x' + epochsHex : epochsHex).toString());

          result.push({ amount, epochs });
        }

        return result;
      }, []);

      const networkConfig = await this.networkService.getNetworkConfig();

      for (const element of data.unstakedTokens) {
        element.expires = element.epochs
          ? RoundUtils.getExpires(element.epochs, networkConfig.roundsPassed, networkConfig.roundsPerEpoch, networkConfig.roundDuration)
          : undefined;
        delete element.epochs;
      }
    }

    return data;
  }
}
