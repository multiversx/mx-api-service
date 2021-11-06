import { Body, Controller, Get, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from 'express';
import { VmQueryRequest } from "../vm.query/entities/vm.query.request";
import { VmQueryService } from "../vm.query/vm.query.service";
import { CachingService } from "src/common/caching/caching.service";
import { Constants } from "src/utils/constants";
import { GatewayService } from "src/common/gateway/gateway.service";

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
  async getAddress(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}`);
  }

  @Get('/address/:address/balance')
  @ApiExcludeEndpoint()
  async getAddressBalance(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/balance`);
  }

  @Get('/address/:address/nonce')
  @ApiExcludeEndpoint()
  async getAddressNonce(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/nonce`);
  }

  @Get('/address/:address/shard')
  @ApiExcludeEndpoint()
  async getAddressShard(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/shard`);
  }

  @Get('/address/:address/storage/:key')
  @ApiExcludeEndpoint()
  async getAddressStorageKey(@Res() res: Response, @Param('address') address: string, @Param('key') key: string) {
    await this.gatewayGet(res, `address/${address}/storage/${key}`);
  }

  @Get('/address/:address/transactions')
  @ApiExcludeEndpoint()
  async getAddressTransactions(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/transactions`);
  }

  @Get('/address/:address/esdt')
  @ApiExcludeEndpoint()
  async getAddressEsdt(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/esdt`, undefined, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('account was not found')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/transaction/send')
  @ApiExcludeEndpoint()
  async transactionSend(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send', body);
  }

  @Post('/transaction/simulate')
  @ApiExcludeEndpoint()
  async transactionSimulate(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/simulate', body);
  }

  @Post('/transaction/send-multiple')
  @ApiExcludeEndpoint()
  async transactionSendMultiple(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send-multiple', body);
  }

  @Post('/transaction/send-user-funds')
  @ApiExcludeEndpoint()
  async transactionSendUserFunds(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send-user-funds', body);
  }

  @Post('/transaction/cost')
  @ApiExcludeEndpoint()
  async transactionCost(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/cost', body);
  }

  @Get('/transaction/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  @ApiQuery({ name: 'withResults', description: 'Include results which correspond to the hash', required: false })
  async getTransaction(
    @Res() res: Response, 
    @Param('hash') hash: string,
    @Query('sender') sender: string | undefined,
    @Query('withResults') withResults: string | undefined,
  ) {
    await this.gatewayGet(res, `transaction/${hash}`, { sender, withResults });
  }

  @Get('/transaction/:hash/status')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  async getTransactionStatus(
    @Res() res: Response, 
    @Param('hash') hash: string,
    @Query('sender') sender: string,
  ) {
    await this.gatewayGet(res, `transaction/${hash}/status`, { sender });
  }

  @Post('/vm-values/hex')
  @ApiExcludeEndpoint()
  async vmValuesHex(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/hex', body);
  }

  @Post('/vm-values/string')
  @ApiExcludeEndpoint()
  async vmValuesString(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/string', body);
  }

  @Post('/vm-values/int')
  @ApiExcludeEndpoint()
  async vmValuesInt(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/int', body);
  }

  @Post('/vm-values/query')
  @ApiExcludeEndpoint()
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query (legacy)',
  })
  async queryLegacy(@Body() query: VmQueryRequest, @Res() res: Response) {
    try {
      let result = await this.vmQueryService.vmQueryFullResult(query.scAddress, query.funcName, query.caller, query.args);
      res.status(HttpStatus.OK).json(result).send();
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }

  @Get('/network/status/:shard')
  @ApiExcludeEndpoint()
  async getNetworkStatusShard(@Res() res: Response, @Param('shard') shard: string) {
    await this.gatewayGet(res, `network/status/${shard}`);
  }

  @Get('/network/config')
  @ApiExcludeEndpoint()
  async getNetworkConfig(@Res() res: Response) {
    await this.gatewayGet(res, 'network/config');
  }

  @Get('/network/economics')
  @ApiExcludeEndpoint()
  async getNetworkEconomics(@Res() res: Response) {
    await this.gatewayGet(res, 'network/economics');
  }

  @Get('/network/total-staked')
  @ApiExcludeEndpoint()
  async getNetworkTotalStaked(@Res() res: Response) {
    await this.gatewayGet(res, 'network/total-staked');
  }

  @Get('/node/heartbeatstatus')
  @ApiExcludeEndpoint()
  async getNodeHeartbeatStatus(@Res() res: Response) {
    try {
      let heartbeat = await this.cachingService.getOrSetCache(
        'heartbeatstatus',
        async () => {
          const result = await this.gatewayService.getRaw('node/heartbeatstatus');
          return result.data;
        },
        Constants.oneMinute() * 2,
      );
      res.json(heartbeat);
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }

  @Get('/validator/statistics')
  @ApiExcludeEndpoint()
  async getValidatorStatistics(@Res() res: Response) {
    await this.gatewayGet(res, 'validator/statistics');
  }

  @Get('/block/:shard/by-nonce/:nonce')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndNonce(
    @Res() res: Response, 
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
    @Query('withTxs') withTxs: string | undefined,
  ) {
    await this.gatewayGet(res, `block/${shard}/by-nonce/${nonce}`, { withTxs });
  }

  @Get('/block/:shard/by-hash/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndHash(
    @Res() res: Response, 
    @Param('shard') shard: string,
    @Param('hash') hash: number,
    @Query('withTxs') withTxs: string | undefined,
  ) {
    await this.gatewayGet(res, `block/${shard}/by-hash/${hash}`, { withTxs });
  }

  @Get('/block-atlas/:shard/:nonce')
  @ApiExcludeEndpoint()
  async getBlockAtlas(
    @Res() res: Response, 
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    await this.gatewayGet(res, `block-atlas/${shard}/${nonce}`);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  @ApiExcludeEndpoint()
  async getHyperblockByNonce(@Res() res: Response, @Param('nonce') nonce: number) {
    await this.gatewayGet(res, `hyperblock/by-nonce/${nonce}`);
  }

  @Get('/hyperblock/by-hash/:hash')
  @ApiExcludeEndpoint()
  async getHyperblockByHash(@Res() res: Response, @Param('hash') hash: number) {
    await this.gatewayGet(res, `hyperblock/by-hash/${hash}`);
  }

  private async gatewayGet(@Res() res: Response, url: string, params: any = undefined, errorHandler?: (error: any) => Promise<boolean>) {
    if (params) {
      url += '?' + Object.keys(params).filter(key => params[key] !== undefined).map(key => `${key}=${params[key]}`).join('&')
    }

    try {
      let result = await this.gatewayService.getRaw(url, errorHandler);
      res.json(result.data);
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }

  private async gatewayPost(@Res() res: Response, url: string, data: any) {
    try {
      let result = await this.gatewayService.createRaw(url, data);
      res.json(result.data);
    } catch (error: any) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }
}