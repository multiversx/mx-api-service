import { Body, Controller, Get, HttpStatus, Param, Query, Res } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { GatewayService } from "src/helpers/gateway.service";
import { Response } from 'express';

@Controller()
@ApiTags('proxy')
export class ProxyController {
  constructor(
    private readonly gatewayService: GatewayService
  ) {}

  @Get('/address/:address')
  async getAddress(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}`);
  }

  @Get('/address/:address/balance')
  async getAddressBalance(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/balance`);
  }

  @Get('/address/:address/nonce')
  async getAddressNonce(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/nonce`);
  }

  @Get('/address/:address/shard')
  async getAddressShard(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/shard`);
  }

  @Get('/address/:address/storage/:key')
  async getAddressStorageKey(@Res() res: Response, @Param('address') address: string, @Param('key') key: string) {
    await this.gatewayGet(res, `address/${address}/storage/${key}`);
  }

  @Get('/address/:address/transactions')
  async getAddressTransactions(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/transactions`);
  }

  @Get('/address/:address/esdt')
  async getAddressEsdt(@Res() res: Response, @Param('address') address: string) {
    await this.gatewayGet(res, `address/${address}/esdt`);
  }

  @Get('/transaction/send')
  async transactionSend(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send', body);
  }

  @Get('/transaction/simulate')
  async transactionSimulate(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/simulate', body);
  }

  @Get('/transaction/send-multiple')
  async transactionSendMultiple(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send-multiple', body);
  }

  @Get('/transaction/send-user-funds')
  async transactionSendUserFunds(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/send-user-funds', body);
  }

  @Get('/transaction/cost')
  async transactionCost(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'transaction/cost', body);
  }

  @Get('/transaction/:hash')
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
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  async getTransactionStatus(
    @Res() res: Response, 
    @Param('hash') hash: string,
    @Query('sender') sender: string,
  ) {
    await this.gatewayGet(res, `transaction/${hash}`, { sender });
  }

  @Get('/vm-values/hex')
  async vmValuesHex(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/hex', body);
  }

  @Get('/vm-values/string')
  async vmValuesString(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/string', body);
  }

  @Get('/vm-values/int')
  async vmValuesInt(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/int', body);
  }

  @Get('/vm-values/query')
  async vmValuesQuery(@Res() res: Response, @Body() body: any) {
    await this.gatewayPost(res, 'vm-values/query', body);
  }

  @Get('/network/status/:shard')
  async getNetworkStatusShard(@Res() res: Response, @Param('shard') shard: string) {
    await this.gatewayGet(res, `network/status/${shard}`);
  }

  @Get('/network/config')
  async getNetworkConfig(@Res() res: Response) {
    await this.gatewayGet(res, 'network/config');
  }

  @Get('/network/economics')
  async getNetworkEconomics(@Res() res: Response) {
    await this.gatewayGet(res, 'network/economics');
  }

  @Get('/network/total-staked')
  async getNetworkTotalStaked(@Res() res: Response) {
    await this.gatewayGet(res, 'network/total-staked');
  }

  @Get('/node/heartbeatstatus')
  async getNodeHeartbeatStatus(@Res() res: Response) {
    await this.gatewayGet(res, 'node/heartbeatstatus');
  }

  @Get('/validator/statistics')
  async getValidatorStatistics(@Res() res: Response) {
    await this.gatewayGet(res, 'validator/statistics');
  }

  @Get('/block/:shard/by-nonce/:nonce')
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
  async getBlockAtlas(
    @Res() res: Response, 
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    await this.gatewayGet(res, `block-atlas/${shard}/${nonce}`);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  async getHyperblockByNonce(@Res() res: Response, @Param('nonce') nonce: number) {
    await this.gatewayGet(res, `hyperblock/by-nonce/${nonce}`);
  }

  @Get('/hyperblock/by-hash/:hash')
  async getHyperblockByHash(@Res() res: Response, @Param('hash') hash: number) {
    await this.gatewayGet(res, `hyperblock/by-hash/${hash}`);
  }

  private async gatewayGet(@Res() res: Response, url: string, params: any = undefined) {
    if (params) {
      url += '?' + Object.keys(params).filter(key => params[key] !== undefined).map(key => `${key}=${params[key]}`).join('&')
    }

    try {
      let result = await this.gatewayService.getRaw(url);
      res.json(result.data);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }

  private async gatewayPost(@Res() res: Response, url: string, data: any) {
    try {
      let result = await this.gatewayService.createRaw(url, data);
      res.json(result.data);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json(error.response.data).send();
    }
  }
}