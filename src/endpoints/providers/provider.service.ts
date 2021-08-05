import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { bech32Encode, oneHour, oneMinute } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderConfig } from "./entities/provider.config";
import { NodeService } from "../nodes/node.service";
import { ProviderFilter } from "src/endpoints/providers/entities/provider.filter";
import { ApiService } from "src/helpers/api.service";
import { KeybaseState } from "src/helpers/entities/keybase.state";
import { KeybaseService } from "src/helpers/keybase.service";

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

  async getProviders(query: ProviderFilter): Promise<Provider[]> {
    let providers = await this.getAllProviders();
    let nodes = await this.nodeService.getAllNodes();

    let grouped: { [key: string]: any[] } = nodes.groupBy(x => x.provider);    

    providers.forEach((element) => {
      const filtered = grouped[element.provider] ?? [];

      const results = filtered.reduce(
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

      element.numNodes = results.numNodes;
      element.stake = results.stake.toString();
      element.topUp = results.topUp.toString();
      element.locked = results.locked.toString();
      // element.sort =
      //   element.locked && element.locked !== '0' ? parseInt(element.locked.slice(0, -18)) : 0;
    });

    let data = await this.getDelegationProviders();

    providers.forEach((provider) => {
      const found = data.find((element: any) => element !== null && provider.provider === element.contract);

      if (found) {
        if (found.aprValue) {
          provider.apr = parseFloat(found.aprValue.toFixed(2));
        }

        if (found.featured !== undefined) {
          provider.featured = found.featured;
        }
      }
    });

    if (query.identity) {
      providers = providers.filter((provider) => provider.identity === query.identity);
    }

    providers.sort((a, b) => {
      let aSort = a.locked && a.locked !== '0' ? parseInt(a.locked.slice(0, -18)) : 0;
      let bSort = b.locked && b.locked !== '0' ? parseInt(b.locked.slice(0, -18)) : 0;

      return bSort - aSort;
    });

    providers.forEach((provider) => {
      // @ts-ignore
      delete provider.owner;
    });

    providers = providers.filter(provider => provider.numNodes > 0 && provider.stake !== '0');

    return providers;
  }

  async getDelegationProviders(): Promise<{ aprValue: number; featured: boolean; }[]> {
    return this.cachingService.getOrSetCache(
      'delegationProviders',
      async () => await this.getDelegationProvidersRaw(),
      oneMinute()
    );
  }

  async getDelegationProvidersRaw(): Promise<{ aprValue: number; featured: boolean }[]> {
    const { data } = await this.apiService.get(this.apiConfigService.getProvidersUrl());

    return data;
  }

  async getAllProviders(): Promise<Provider[]> {
    return await this.cachingService.getOrSetCache('providers', async () => await this.getAllProvidersRaw(), oneHour());
  }

  async getAllProvidersRaw() : Promise<Provider[]> {
    const providers = await this.getProviderAddresses();

    const [configs, numUsers, cumulatedRewards] = await Promise.all([
      this.cachingService.batchProcess(
        providers,
        address => `providerConfig:${address}`,
        async address => await this.getProviderConfig(address),
        oneMinute() * 15,
      ),
      this.cachingService.batchProcess(
        providers,
        address => `providerNumUsers:${address}`,
        async address => await this.getNumUsers(address),
        oneHour(),
      ),
      this.cachingService.batchProcess(
        providers,
        address => `providerCumulatedRewards:${address}`,
        async address => await this.getCumulatedRewards(address),
        oneHour()
      ),
    ]);

    const value: Provider[] = providers.map((provider, index) => {
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

    let providerKeybases = await this.cachingService.getOrSetCache<{ [key: string]: KeybaseState }>(
      'providerKeybases',
      async () => await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub(),
      oneHour()
    );
    
    if (providerKeybases) {
      for (let providerAddress of providers) {
        let providerInfo = providerKeybases[providerAddress];
        if (providerInfo) {
          const found = value.find(x => x.provider === providerAddress);
          if (found) {
            found.identity = providerInfo.identity;
          }
        }
      }
    };

    return value;
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
      bech32Encode(Buffer.from(providerBase64, 'base64').toString('hex'))
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
  
    const owner = bech32Encode(Buffer.from(ownerBase64, 'base64').toString('hex'));
  
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
        const [name, website, identity] = response.map((base64) =>
          Buffer.from(base64, 'base64').toString().trim().toLowerCase()
        );
    
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