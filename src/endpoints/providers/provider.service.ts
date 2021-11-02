import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderConfig } from "./entities/provider.config";
import { NodeService } from "../nodes/node.service";
import { ProviderFilter } from "src/endpoints/providers/entities/provider.filter";
import { Constants } from "src/utils/constants";
import { AddressUtils } from "src/utils/address.utils";
import { NodesInfos } from "./entities/nodes.infos";
import { DelegationData } from "./entities/delegation.data";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { ApiService } from "src/common/network/api.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";

@Injectable()
export class ProviderService {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => KeybaseService))
    private readonly keybaseService: KeybaseService,
  ) {
    this.logger = new Logger(ProviderService.name);
  }

  async getProvider(address: string): Promise<Provider | undefined> {
    let query = new ProviderFilter();
    let providers = await this.getProviders(query);

    return providers.find(x => x.provider === address);
  }

  private getNodesInfosForProvider(providerNodes: any[]): NodesInfos {
    const results = providerNodes.reduce(
      (accumulator, current) => {
        if (current && current.stake && current.topUp && current.locked) {
          accumulator.numNodes += 1;
          accumulator.stake += BigInt(current.stake);
          accumulator.topUp += BigInt(current.topUp);
          accumulator.locked += BigInt(current.locked);
        }

        return accumulator;
      },
      {
        numNodes: 0,
        stake: BigInt('0'),
        topUp: BigInt('0'),
        locked: BigInt('0'),
      }
    );
    
    const nodesInfos: NodesInfos = new NodesInfos();
    nodesInfos.numNodes = results.numNodes;
    nodesInfos.stake = results.stake.toString();
    nodesInfos.topUp = results.topUp.toString();
    nodesInfos.locked = results.locked.toString();

    return nodesInfos;
  }

  async getProvidersWithStakeInformation(): Promise<Provider[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.ProvidersWithStakeInformation().key,
      async () => await this.getProvidersWithStakeInformationRaw(),
      CacheInfo.ProvidersWithStakeInformation().ttl
    );
  }

  async getProvidersWithStakeInformationRaw(): Promise<Provider[]> {
    let providers = await this.getAllProviders();
    let nodes = await this.nodeService.getAllNodes();

    let nodesGroupedByProvider: { [key: string]: any[] } = nodes.groupBy(x => x.provider);    

    let providersDelegationData: DelegationData[] = await this.getDelegationProviders();

    providers.forEach((element) => {
      const providerAddress = element.provider;

    // Delegation details for provider
      const delegationData: DelegationData | undefined = providersDelegationData.find((providerDelegationInfo: any) => providerDelegationInfo !== null && providerAddress === providerDelegationInfo.contract);
      if (delegationData) {
        if (delegationData.aprValue) {
          element.apr = parseFloat(delegationData.aprValue.toFixed(2));
        }

        if (delegationData.featured) {
          element.featured = delegationData.featured;
        }
      }

    // Add Nodes details for provider
      const providerNodes = nodesGroupedByProvider[providerAddress] ?? [];
      const nodesInfos: NodesInfos = this.getNodesInfosForProvider(providerNodes);
      element.numNodes = nodesInfos.numNodes;
      element.stake = nodesInfos.stake;
      element.topUp = nodesInfos.topUp;
      element.locked = nodesInfos.locked;

      // @ts-ignore
      delete element.owner;
    });

    providers.sort((a, b) => {
      let aSort = a.locked && a.locked !== '0' ? parseInt(a.locked.slice(0, -18)) : 0;
      let bSort = b.locked && b.locked !== '0' ? parseInt(b.locked.slice(0, -18)) : 0;

      return bSort - aSort;
    });

    providers = providers.filter(provider => provider.numNodes > 0 && provider.stake !== '0');

    return providers;
  }

  async getProviders(query: ProviderFilter): Promise<Provider[]> {
    let providers = await this.getProvidersWithStakeInformation();

    if (query.identity) {
      providers = providers.filter((provider) => provider.identity === query.identity);
    }

    return providers;
  }

  async getDelegationProviders(): Promise<DelegationData[]> {
    return this.cachingService.getOrSetCache(
      'delegationProviders',
      async () => await this.getDelegationProvidersRaw(),
      Constants.oneMinute()
    );
  }

  async getDelegationProvidersRaw(): Promise<DelegationData[]> {
    try {
      const { data } = await this.apiService.get(this.apiConfigService.getProvidersUrl());
      return data;
    } catch (error) {
      this.logger.error('Error when getting delegation providers');
      this.logger.error(error);
      return [];
    }
  }

  async getAllProviders(): Promise<Provider[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Providers().key, 
      async () => await this.getAllProvidersRaw(), 
      CacheInfo.Providers().ttl
    );
  }

  async getAllProvidersRaw() : Promise<Provider[]> {
    const providers = await this.getProviderAddresses();

    const [configs, numUsers, cumulatedRewards] = await Promise.all([
      this.cachingService.batchProcess(
        providers,
        address => `providerConfig:${address}`,
        async address => await this.getProviderConfig(address),
        Constants.oneMinute() * 15,
      ),
      this.cachingService.batchProcess(
        providers,
        address => `providerNumUsers:${address}`,
        async address => await this.getNumUsers(address),
        Constants.oneHour(),
      ),
      this.cachingService.batchProcess(
        providers,
        address => `providerCumulatedRewards:${address}`,
        async address => await this.getCumulatedRewards(address),
        Constants.oneHour()
      ),
    ]);

    const providersRaw: Provider[] = providers.map((provider, index) => {
      return {
        provider,
        ...configs[index],
        numUsers: numUsers[index] ?? 0,
        cumulatedRewards: cumulatedRewards[index] ?? '0',
        identity: undefined,
        numNodes: 0,
        stake: '0',
        topUp: '0',
        locked: '0',
        featured: false
      };
    });

    let providerKeybases = await this.keybaseService.getCachedNodesAndProvidersKeybases();
    
    if (providerKeybases) {
      for (let providerAddress of providers) {
        let providerInfo = providerKeybases[providerAddress];

        if (providerInfo && providerInfo.confirmed) {
          const found = providersRaw.find(x => x.provider === providerAddress);
          if (found) {
            found.identity = providerInfo.identity;
          }
        }
      }
    };

    return providersRaw;
  }

  async getProviderAddresses() {
    let providersBase64: string[];
    try {
      providersBase64 = await this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationManagerContractAddress(),
        'getAllContractAddresses',
      );
    } catch (error) {
      this.logger.error(error);
      return [];
    }

    if (!providersBase64) {
      return [];
    }
  
    const value = providersBase64.map((providerBase64) =>
      AddressUtils.bech32Encode(Buffer.from(providerBase64, 'base64').toString('hex'))
    );
  
    return value;
  };

  async getProviderConfig(address: string): Promise<ProviderConfig> {
    let [
      ownerBase64,
      serviceFeeBase64,
      delegationCapBase64,
      // initialOwnerFundsBase64,
      // automaticActivationBase64,
      // changeableServiceFeeBase64,
      // checkCapOnredelegateBase64,
      // unBondPeriodBase64,
      // createdNonceBase64,
    ] = await this.vmQueryService.vmQuery(
      address,
      'getContractConfig',
    );
  
    const owner = AddressUtils.bech32Encode(Buffer.from(ownerBase64, 'base64').toString('hex'));
  
    const [serviceFee, delegationCap] = [
      // , initialOwnerFunds, createdNonce
      serviceFeeBase64,
      delegationCapBase64,
      // initialOwnerFundsBase64,
      // createdNonceBase64,
    ].map((base64) => {
      const hex = base64 ? Buffer.from(base64, 'base64').toString('hex') : base64;
      return hex === null ? null : BigInt(hex ? '0x' + hex : hex).toString();
    });
  
    // const [automaticActivation, changeableServiceFee, checkCapOnredelegate] = [
    //   automaticActivationBase64,
    //   changeableServiceFeeBase64,
    //   checkCapOnredelegateBase64,
    // ].map((base64) => (Buffer.from(base64, 'base64').toString() === 'true' ? true : false));

    let serviceFeeString = String(parseInt(serviceFee ?? '0') / 10000);
  
    return {
      owner,
      serviceFee: parseFloat(serviceFeeString),
      delegationCap: delegationCap ?? '0',
      apr: 0
      // initialOwnerFunds,
      // automaticActivation,
      // changeableServiceFee,
      // checkCapOnredelegate,
      // createdNonce: parseInt(createdNonce),
    };
  };

  async getProviderMetadata(address: string) {
    const response = await this.vmQueryService.vmQuery(
      address,
      'getMetaData',
    );
  
    if (response) {
      try {
        const [name, website, identity] = response.map((base64) => {
          if(base64) {
            return Buffer.from(base64, 'base64').toString().trim().toLowerCase();
          }
          return "";
        });
    
        return { name, website, identity }; 
      } catch (error) {
        this.logger.error(`Could not get provider metadata for address '${address}'`);
        this.logger.error(error);
        return { name: null, website: null, identity: null };
      }
    }
  
    return { name: null, website: null, identity: null };
  };
  
  async getNumUsers(address: string) {
    const [base64] = await this.vmQueryService.vmQuery(
      address,
      'getNumUsers',
    );
  
    if (base64) {
      const hex = Buffer.from(base64, 'base64').toString('hex');
      return Number(BigInt(hex ? '0x' + hex : hex));
    }
  
    return null;
  };

  async getCumulatedRewards(address: string): Promise<string | null> {
    const [base64] = await this.vmQueryService.vmQuery(
      address,
      'getTotalCumulatedRewards',
      'erd1qqqqqqqqqqqqqqqpqqqqqqqqlllllllllllllllllllllllllllsr9gav8',
    );
  
    if (base64) {
      const hex = Buffer.from(base64, 'base64').toString('hex');
      return BigInt(hex ? '0x' + hex : hex).toString();
    }
  
    return null;
  };
}