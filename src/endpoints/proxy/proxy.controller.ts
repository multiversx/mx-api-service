import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "../vm.query/entities/vm.query.request";
import { VmQueryService } from "../vm.query/vm.query.service";
import { CachingService } from "src/common/caching/caching.service";
import { Constants } from "src/utils/constants";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ParseAddressPipe } from "src/utils/pipes/parse.address.pipe";
import { ParseTransactionHashPipe } from "src/utils/pipes/parse.transaction.hash.pipe";
import { ParseBlockHashPipe } from "src/utils/pipes/parse.block.hash.pipe";

@Controller()
@ApiTags('proxy')
export class ProxyController {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
  ) {}

  @Get('/address/:address')
  @ApiExcludeEndpoint()
  async getAddress(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}`);
  }

  @Get('/address/:address/balance')
  @ApiExcludeEndpoint()
  async getAddressBalance(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/balance`);
  }

  @Get('/address/:address/nonce')
  @ApiExcludeEndpoint()
  async getAddressNonce(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/nonce`);
  }

  @Get('/address/:address/shard')
  @ApiExcludeEndpoint()
  async getAddressShard(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/shard`);
  }

  @Get('/address/:address/storage/:key')
  @ApiExcludeEndpoint()
  async getAddressStorageKey(@Param('address', ParseAddressPipe) address: string, @Param('key') key: string) {
    return await this.gatewayGet(`address/${address}/storage/${key}`);
  }

  @Get('/address/:address/transactions')
  @ApiExcludeEndpoint()
  async getAddressTransactions(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/transactions`);
  }

  @Get('/address/:address/esdt')
  @ApiExcludeEndpoint()
  async getAddressEsdt(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/esdt`, undefined, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('account was not found')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/transaction/send')
  @ApiExcludeEndpoint()
  async transactionSend(@Body() body: any) {
    if (!body.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!body.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    return await this.gatewayPost('transaction/send', body);
  }

  @Post('/transaction/simulate')
  @ApiExcludeEndpoint()
  async transactionSimulate(@Body() body: any) {
    return await this.gatewayPost('transaction/simulate', body);
  }

  @Post('/transaction/send-multiple')
  @ApiExcludeEndpoint()
  async transactionSendMultiple(@Body() body: any) {
    return await this.gatewayPost('transaction/send-multiple', body);
  }

  @Post('/transaction/send-user-funds')
  @ApiExcludeEndpoint()
  async transactionSendUserFunds(@Body() body: any) {
    return await this.gatewayPost('transaction/send-user-funds', body);
  }

  @Post('/transaction/cost')
  @ApiExcludeEndpoint()
  async transactionCost(@Body() body: any) {
    return await this.gatewayPost('transaction/cost', body);
  }

  @Get('/transaction/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  @ApiQuery({ name: 'withResults', description: 'Include results which correspond to the hash', required: false })
  async getTransaction(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender: string | undefined,
    @Query('withResults') withResults: string | undefined,
  ) {
    return await this.gatewayGet(`transaction/${hash}`, { sender, withResults });
  }

  @Get('/transaction/:hash/status')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  async getTransactionStatus(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}/status`, { sender });
  }

  @Post('/vm-values/hex')
  @ApiExcludeEndpoint()
  async vmValuesHex(@Body() body: any) {
    return await this.gatewayPost('vm-values/hex', body);
  }

  @Post('/vm-values/string')
  @ApiExcludeEndpoint()
  async vmValuesString(@Body() body: any) {
    return await this.gatewayPost('vm-values/string', body);
  }

  @Post('/vm-values/int')
  @ApiExcludeEndpoint()
  async vmValuesInt(@Body() body: any) {
    return await this.gatewayPost('vm-values/int', body);
  }

  @Post('/vm-values/query')
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query (legacy)',
  })
  async queryLegacy(@Body() query: VmQueryRequest, ) {
    try {
      return await this.vmQueryService.vmQueryFullResult(query.scAddress, query.funcName, query.caller, query.args);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/network/status/:shard')
  @ApiExcludeEndpoint()
  async getNetworkStatusShard(@Param('shard') shard: string) {
    return await this.gatewayGet(`network/status/${shard}`);
  }

  @Get('/network/config')
  @ApiExcludeEndpoint()
  async getNetworkConfig() {
    return await this.gatewayGet('network/config');
  }

  @Get('/network/economics')
  @ApiExcludeEndpoint()
  async getNetworkEconomics() {
    return await this.gatewayGet('network/economics');
  }

  @Get('/network/total-staked')
  @ApiExcludeEndpoint()
  async getNetworkTotalStaked() {
    return await this.gatewayGet('network/total-staked');
  }

  @Get('/node/heartbeatstatus')
  @ApiExcludeEndpoint()
  async getNodeHeartbeatStatus() {
    try {
      return await this.cachingService.getOrSetCache(
        'heartbeatstatus',
        async () => {
          const result = await this.gatewayService.getRaw('node/heartbeatstatus');
          return result.data;
        },
        Constants.oneMinute() * 2,
      );
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/validator/statistics')
  @ApiExcludeEndpoint()
  async getValidatorStatistics() {
    try {
      return await this.cachingService.getOrSetCache(
        'validatorstatistics',
        async () => {
          const result = await this.gatewayService.getRaw('validator/statistics');
          return result.data;
        },
        Constants.oneMinute(),
      );
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/block/:shard/by-nonce/:nonce')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndNonce(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
    @Query('withTxs') withTxs: string | undefined,
  ) {
    return await this.gatewayGet(`block/${shard}/by-nonce/${nonce}`, { withTxs });
  }

  @Get('/block/:shard/by-hash/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndHash(
    @Param('shard') shard: string,
    @Param('hash') hash: number,
    @Query('withTxs') withTxs: string | undefined,
  ) {
    return await this.gatewayGet(`block/${shard}/by-hash/${hash}`, { withTxs });
  }

  @Get('/block-atlas/:shard/:nonce')
  @ApiExcludeEndpoint()
  async getBlockAtlas(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    return await this.gatewayGet(`block-atlas/${shard}/${nonce}`);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  @ApiExcludeEndpoint()
  async getHyperblockByNonce(@Param('nonce') nonce: number) {
    return await this.gatewayGet(`hyperblock/by-nonce/${nonce}`);
  }

  @Get('/hyperblock/by-hash/:hash')
  @ApiExcludeEndpoint()
  async getHyperblockByHash(@Param('hash', ParseBlockHashPipe) hash: number) {
    return await this.gatewayGet(`hyperblock/by-hash/${hash}`);
  }

  private async gatewayGet(url: string, params: any = undefined, errorHandler?: (error: any) => Promise<boolean>) {
    if (params) {
      url += '?' + Object.keys(params).filter(key => params[key] !== undefined).map(key => `${key}=${params[key]}`).join('&')
    }

    try {
      let result = await this.gatewayService.getRaw(url, errorHandler);
      return result.data;
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  private async gatewayPost(url: string, data: any) {
    try {
      let result = await this.gatewayService.createRaw(url, data);
      return result.data;
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }
}