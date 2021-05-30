import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { bech32Encode, oneHour, oneMinute, oneWeek } from "src/helpers/helpers";
import { KeybaseService } from "src/helpers/keybase.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Keybase } from "src/helpers/entities/keybase";
import { Provider } from "src/endpoints/providers/entities/provider";
import { ProviderConfig } from "./entities/provider.config";
import { NodeService } from "../nodes/node.service";
import { ProviderQuery } from "src/endpoints/providers/entities/provider.query";
import { PerformanceProfiler } from "src/helpers/performance.profiler";
import { ApiService } from "src/helpers/api.service";

@Injectable()
export class ProviderService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    private readonly keybaseService: KeybaseService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService
  ) {}

  async getProvider(address: string): Promise<Provider | undefined> {
    let query = new ProviderQuery();
    let providers = await this.getProviders(query);

    return providers.find(x => x.provider === address);
  }

  async getProviders(query: ProviderQuery): Promise<Provider[]> {
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

    let profiler = new PerformanceProfiler('axios');
    let data = await this.getDelegationProviders();
    profiler.stop();

    providers.forEach((provider) => {
      const found = data.find((element: any) => element !== null && provider.provider === element.contract);

      if (found && found.aprValue) {
        provider.apr = parseFloat(found.aprValue.toFixed(2));
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

    return providers;
  }

  async getDelegationProviders(): Promise<{ aprValue: number; }[]> {
    return this.cachingService.getOrSetCache(
      'delegationProviders',
      async () => await this.getDelegationProvidersRaw(),
      oneMinute()
    );
  }

  async getDelegationProvidersRaw(): Promise<{ aprValue: number; }[]> {
    const { data } = await this.apiService.get(this.apiConfigService.getProvidersUrl());

    return data;
  }

  async getAllProviders(): Promise<Provider[]> {
    return await this.cachingService.getOrSetCache('providers', async () => await this.getAllProvidersRaw(), oneHour());
  }

  async tryGetAllProvidersRaw(): Promise<Provider[]> {
    try {
      return await this.getAllProvidersRaw();
    } catch (error) {
      console.error('getProviders error', error);
      return [];
    }
  }

  async getAllProvidersRaw() : Promise<Provider[]> {
    const providers = await this.getProviderAddresses();

    const [configs, metadatas, numUsers, cumulatedRewards] = await Promise.all([
      this.cachingService.batchProcess(
        providers,
        address => `providerConfig:${address}`,
        async address => await this.getProviderConfig(address),
        oneMinute() * 15,
      ),
      this.cachingService.batchProcess(
        providers,
        address => `providerMetadata:${address}`,
        async address => await this.getProviderMetadata(address),
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

    const keybases: Keybase[] = metadatas
      .filter(({ identity }) => !!identity)
      .map(({ identity }, index) => {
        return { identity: identity ?? '', key: providers[index] };
      });

    const confirmedKeybases = await this.cachingService.batchProcess(
      keybases,
      keybase => `keybase:${keybase.identity}:${keybase.key}`,
      async (keybase) => await this.keybaseService.confirmKeybase(keybase),
      oneWeek(),
    );

    const value: Provider[] = providers.map((provider, index) => {
      return {
        provider,
        ...configs[index],
        numUsers: numUsers[index] ?? 0,
        cumulatedRewards: cumulatedRewards[index] ?? '0',
        identity: '',
        numNodes: 0,
        stake: '0',
        topUp: '0',
        locked: '0'
      };
    });

    keybases.forEach(({ identity, key }, index) => {
      if (confirmedKeybases[index]) {
        console.log(`Confirmed keybase for identity ${identity} and key ${key}`);
      } else {
        console.log(`Unconfirmed keybase for identity ${identity} and key ${key}`);
      }

      const found = value.find(({ provider }) => provider === key);
      if (found) {
        found.identity = identity;
      }
    });

    return value;
  }

  async getProviderAddresses() {
    return await this.cachingService.getOrSetCache('providersAddresses', async () => await this.getProviderAddressesRaw(), this.apiConfigService.getProcessTtl());
  }

  async getProviderAddressesRaw() {
    const providersBase64 = await this.vmQueryService.vmQuery(
      this.apiConfigService.getDelegationManagerContractAddress(),
      'getAllContractAddresses',
    );

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
      const [name, website, identity] = response.map((base64) =>
        Buffer.from(base64, 'base64').toString().trim().toLowerCase()
      );
  
      return { name, website, identity };
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