import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { GatewayService } from "src/helpers/gateway.service";
import { bech32Encode, oneDay, oneHour } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";

@Injectable()
export class TokenService {
  constructor(
    private readonly gatewayService: GatewayService, 
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
  ) {}

  async getToken(identifier: string): Promise<Token | undefined> {
    let tokens = await this.getAllTokens();
    return tokens.find(x => x.token === identifier);
  }

  async getTokens(from: number, size: number, search: string | undefined): Promise<Token[]> {
    let tokens = await this.getAllTokens();

    tokens = tokens.slice(from, from + size);

    if (search) {
      let searchLower = search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.token.toLowerCase().includes(searchLower));
    }

    return tokens;
  }

  async getTokenCount(): Promise<number> {
    let allTokens = await this.getAllTokens();
    return allTokens.length;
  }

  async getNft(identifier: string): Promise<Token | undefined> {
    let nfts = await this.getAllNfts();
    return nfts.find(x => x.token === identifier);
  }

  async getNfts(from: number, size: number, search: string | undefined): Promise<Token[]> {
    let nfts = await this.getAllNfts();

    nfts = nfts.slice(from, from + size);

    if (search) {
      let searchLower = search.toLowerCase();

      nfts = nfts.filter(token => token.name.toLowerCase().includes(searchLower) || token.token.toLowerCase().includes(searchLower));
    }

    return nfts;
  }

  async getNftCount(): Promise<number> {
    let allNfts = await this.getAllNfts();
    return allNfts.length;
  }
  
  async getTokenCountForAddress(address: string): Promise<number> {
    let tokens = await this.getTokensForAddress(address);
    return tokens.length;
  }

  async getTokensForAddress(address: string): Promise<Token[]> {
    return await this.cachingService.getOrSetCache(
      `tokens:${address}`,
      async () => await this.getTokensForAddressRaw(address),
      oneHour(),
      6
    );
  }

  async getTokensForAddressRaw(address: string): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokens();

    let tokensIndexed: { [index: string]: Token } = {};
    for (let token of tokens) {
      tokensIndexed[token.token] = token;
    }

    let esdtResult = await this.gatewayService.get(`address/${address}/esdt`);

    let tokensWithBalance: TokenWithBalance[] = [];

    for (let tokenIdentifier of Object.keys(esdtResult.esdts)) {
      let esdt = esdtResult.esdts[tokenIdentifier];
      let token = tokensIndexed[tokenIdentifier];
      if (!token) {
        console.log(`Could not find token with identifier ${tokenIdentifier}`);
        continue;
      }

      let tokenWithBalance = {
        balance: esdt.balance,
        ...token
      };

      tokensWithBalance.push(tokenWithBalance);
    }

    return tokensWithBalance;
  }

  async getAllTokens(): Promise<Token[]> {
    return this.cachingService.getOrSetCache(
      'allTokens',
      async () => await this.getAllTokensRaw(),
      oneHour()
    );
  }

  async getAllTokensRaw(): Promise<Token[]> {
    const {
      tokens: tokensIdentifiers,
    } = await this.gatewayService.get('network/esdt/fungible-tokens');

    let tokens = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      oneDay()
    );

    // @ts-ignore
    return tokens;
  }

  async getAllNfts(): Promise<Token[]> {
    return this.cachingService.getOrSetCache(
      'allNfts',
      async () => await this.getAllNftsRaw(),
      oneHour()
    );
  }

  async getAllNftsRaw(): Promise<Token[]> {
    const {
      tokens: nftIdentifiers,
    } = await this.gatewayService.get('network/esdt/non-fungible-tokens');

    const {
      tokens: sftIdentifiers,
    } = await this.gatewayService.get('network/esdt/semi-fungible-tokens');

    let nfts = await this.cachingService.batchProcess(
      nftIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      oneDay()
    );

    let sfts = await this.cachingService.batchProcess(
      sftIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      oneDay()
    );

    // @ts-ignore
    return nfts.concat(...sfts);
  }

  async getTokenProperties(token: string) {
    const arg = Buffer.from(token, 'utf8').toString('hex');
  
    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [ arg ],
      true
    );
  
    const tokenProperties = tokenPropertiesEncoded.map((encoded, index) =>
      Buffer.from(encoded, 'base64').toString(index === 2 ? 'hex' : undefined)
    );
  
    const [
      name,
      type,
      owner,
      minted,
      burnt,
      decimals,
      isPaused,
      canUpgrade,
      canMint,
      canBurn,
      canChangeOwner,
      canPause,
      canFreeze,
      canWipe,
      canAddSpecialRoles,
      canTransferNFTCreateRole,
      NFTCreateStopped,
      wiped,
    ] = tokenProperties;
  
    const tokenProps = {
      token,
      name,
      type,
      owner: bech32Encode(owner),
      minted,
      burnt,
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: this.canBool(isPaused),
      canUpgrade: this.canBool(canUpgrade),
      canMint: this.canBool(canMint),
      canBurn: this.canBool(canBurn),
      canChangeOwner: this.canBool(canChangeOwner),
      canPause: this.canBool(canPause),
      canFreeze: this.canBool(canFreeze),
      canWipe: this.canBool(canWipe),
      canAddSpecialRoles: this.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: this.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: this.canBool(NFTCreateStopped),
      wiped: wiped.split('-').pop(),
    };
  
    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canAddSpecialRoles;
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      delete tokenProps.wiped;
    }
  
    return tokenProps;
  };

  canBool(string: string) {
    return string.split('-').pop() === 'true';
  };
}