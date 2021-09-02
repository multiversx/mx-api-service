import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) { }

  getApiUrls(): string[] {
    const apiUrls = this.configService.get<string[]>('urls.api');
    if (!apiUrls) {
      throw new Error('No API urls present');
    }

    return apiUrls;
  }

  getGatewayUrl(): string {
    const gatewayUrls = this.configService.get<string[]>('urls.gateway');
    if (!gatewayUrls) {
      throw new Error('No gateway urls present');
    }

    return gatewayUrls[Math.floor(Math.random() * gatewayUrls.length)];
  }

  getElasticUrl(): string {
    const elasticUrls = this.configService.get<string[]>('urls.elastic');
    if (!elasticUrls) {
      throw new Error('No elastic urls present');
    }

    return elasticUrls[Math.floor(Math.random() * elasticUrls.length)];
  }

  getEsdtContractAddress(): string {
    const address = this.configService.get<string>('contracts.esdt');
    if (!address) {
      throw new Error('No ESDT contract present');
    }

    return address;
  }

  getAuctionContractAddress(): string {
    const address = this.configService.get<string>('contracts.auction');
    if (!address) {
      throw new Error('No auction contract present');
    }

    return address;
  }

  getStakingContractAddress(): string {
    const address = this.configService.get<string>('contracts.staking');
    if (!address) {
      throw new Error('No staking contract present');
    }

    return address;
  }

  getDelegationContractAddress(): string {
    const address = this.configService.get<string>('contracts.delegation');
    if (!address) {
      throw new Error('No delegation contract present');
    }

    return address;
  }

  getDelegationContractShardId(): number {
    const shardId = this.configService.get<number>('contracts.delegationShardId');
    if (!shardId) {
      throw new Error('No delegation contract shard ID present');
    }

    return shardId;
  }

  getDelegationManagerContractAddress(): string {
    const address = this.configService.get<string>('contracts.delegationManager');
    if (!address) {
      throw new Error('No delegation manager contract present');
    }

    return address;
  }

  getVmQueryUrl(): string {
    return this.getGatewayUrl();
  }

  getRedisUrl(): string {
    const redisUrl = this.configService.get<string>('urls.redis');
    if (!redisUrl) {
      throw new Error('No redis url present');
    }

    return redisUrl;
  }

  getCacheTtl(): number {
    return this.configService.get<number>('caching.cacheTtl') ?? 6;
  }

  getNetwork(): string {
    let network = this.configService.get<string>('network');
    if (!network) {
      throw new Error('No network present');
    }

    return network;
  }

  getPoolLimit(): number {
    return this.configService.get<number>('caching.poolLimit') ?? 10;
  }

  getProcessTtl(): number {
    return this.configService.get<number>('caching.processTtl') ?? 60;
  }

  getAxiosTimeout(): number {
    return this.configService.get<number>('keepAliveTimeout.downstream') ?? 61000;
  }

  getServerTimeout(): number {
    return this.configService.get<number>('keepAliveTimeout.upstream') ?? 60000;
  }

  getProvidersUrl(): string {
    let providerUrl = this.configService.get<string>('urls.providers');
    if (!providerUrl) {
      throw new Error('No providers url present');
    }

    return providerUrl;
  }

  getDataUrl(): string | undefined {
    return this.configService.get<string>('urls.dataUrl');
  }

  getIsTransactionProcessorCronActive(): boolean {
    let isCronActive = this.configService.get<boolean>('cron.transactionProcessor');
    if (isCronActive === undefined) {
      throw new Error('No cron.transactionProcessor flag present');
    }

    return isCronActive;
  }

  getTransactionProcessorMaxLookBehind(): number {
    let transactionProcessorMaxLookBehind = this.configService.get<number>('cron.transactionProcessorMaxLookBehind');
    if (transactionProcessorMaxLookBehind === undefined) {
      throw new Error('No cron.transactionProcessorMaxLookBehind flag present');
    }

    return transactionProcessorMaxLookBehind;
  }

  getIsCacheWarmerCronActive(): boolean {
    let isCronActive = this.configService.get<boolean>('cron.cacheWarmer');
    if (isCronActive === undefined) {
      throw new Error('No cron.cacheWarmer flag present');
    }

    return isCronActive;
  }

  getIsPublicApiActive(): boolean {
    let isApiActive = this.configService.get<boolean>('api.public');
    if (isApiActive === undefined) {
      throw new Error('No api.public flag present');
    }

    return isApiActive;
  }

  getIsPrivateApiActive(): boolean {
    let isApiActive = this.configService.get<boolean>('api.private');
    if (isApiActive === undefined) {
      throw new Error('No api.private flag present');
    }

    return isApiActive;
  }

  getMetaChainShardId(): number {
    let metaChainShardId = this.configService.get<number>('metaChainShardId');
    if (metaChainShardId === undefined) {
      throw new Error('No metaChainShardId present');
    }

    return metaChainShardId;
  }

  getUseLegacyElastic(): boolean {
    let useLegacyElastic = this.configService.get<boolean>('useLegacyElastic');
    if (useLegacyElastic === undefined) {
      return false;
    }

    return useLegacyElastic;
  }

  getRateLimiterSecret(): string | undefined {
    return this.configService.get<string>('rateLimiterSecret');
  }

  getInflationAmounts(): number[] {
    let inflationAmounts = this.configService.get<number[]>('inflation');
    if (!inflationAmounts) {
      throw new Error('No inflation amounts present');
    }

    return inflationAmounts;
  }

  getMediaUrl(): string {
    let mediaUrl = this.configService.get<string>('urls.media');
    if (!mediaUrl) {
      throw new Error('No media url present');
    }

    return mediaUrl;
  }

<<<<<<< HEAD
  getExtrasApiUrl(): string {
    let extrasApiUrl = this.configService.get<string>('urls.extras');
    if (!extrasApiUrl) {
      throw new Error('No extras api url present');
    }

    return extrasApiUrl;
  }

  getTransactionsScamCheck(): boolean {
    var transactionsScamCheck = this.configService.get<boolean>('transactionsScamCheck');
    if (transactionsScamCheck === undefined) {
      throw new Error('No extras api url present');
    }
    return transactionsScamCheck;
=======
  getNftThumbnailsUrl(): string {
    let nftThumbnailsUrl = this.configService.get<string>('urls.nftThumbnails');
    if (!nftThumbnailsUrl) {
      throw new Error('No nft thumbnails url present');
    }

    return nftThumbnailsUrl;
  }

  getSecurityAdmins(): string[] {
    let admins = this.configService.get<string[]>('security.admins');
    if (admins === undefined) {
      throw new Error('No security admins value present');
    }

    return admins;
  }

  getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('security.jwtSecret');
    if (!jwtSecret) {
      throw new Error('No jwtSecret present');
    }

    return jwtSecret;
>>>>>>> development
  }
}