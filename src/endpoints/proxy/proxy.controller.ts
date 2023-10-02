import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "../vm.query/entities/vm.query.request";
import { VmQueryService } from "../vm.query/vm.query.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { Response, Request } from "express";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { PluginService } from "src/common/plugins/plugin.service";
import { Constants, ParseAddressPipe, ParseBlockHashPipe, ParseTransactionHashPipe } from "@multiversx/sdk-nestjs-common";
import { CacheService, NoCache } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Controller()
@ApiTags('proxy')
export class ProxyController {
  private readonly logger = new OriginLogger(ProxyController.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CacheService,
    private readonly pluginService: PluginService,
  ) { }

  @Get('/address/:address')
  @ApiOperation({
    summary: 'Account Details',
    description: 'Returns account details for a given address. Proxy Type: Snapshotless',
  })
  async getAddress(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}`, GatewayComponentRequest.addressDetails);
  }

  @Get('/address/:address/balance')
  @ApiOperation({
    summary: 'Account Balance',
    description: 'Returns account balance for a given address. Proxy Type: Snapshotless',
  })
  async getAddressBalance(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/balance`, GatewayComponentRequest.addressBalance);
  }

  @Get('/address/:address/nonce')
  @ApiOperation({
    summary: 'Account nonce',
    description: 'Returns account nonce for a given address. Proxy Type: Regular',
  })
  async getAddressNonce(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/nonce`, GatewayComponentRequest.addressNonce);
  }

  @Get('/address/:address/shard')
  @ApiOperation({
    summary: 'Account shard',
    description: 'Returns account shard for a given address. Proxy Type: Regular',
  })
  async getAddressShard(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/shard`, GatewayComponentRequest.addressShard);
  }

  @Get('/address/:address/key/:key')
  @ApiOperation({
    summary: 'Account key',
    description: 'Returns account shard for a given address. Proxy Type: Regular',
  })
  async getAddressStorageKey(@Param('address', ParseAddressPipe) address: string, @Param('key') key: string) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`address/${address}/key/${key}`, GatewayComponentRequest.addressStorage, undefined, async (error) => {
      if (error?.response?.data?.error?.includes('get value for key error')) {
        throw error;
      }

      return false;
    });
  }

  @Get('/address/:address/transactions')
  @ApiOperation({
    summary: 'Account transactions',
    description: 'Returns details of all transactions where the account is sender or receiver. Proxy Type: Regular',
  })
  async getAddressTransactions(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/transactions`, GatewayComponentRequest.addressTransactions);
  }

  @Get('/address/:address/guardian-data')
  @ApiOperation({
    summary: 'Account guardian-data',
    description: 'Returns guardian data for a given address. Proxy Type: Regular',
  })
  async getAddressGuardianData(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/guardian-data`, GatewayComponentRequest.guardianData);
  }

  @Get('/address/:address/esdt')
  @ApiOperation({
    summary: 'Account esdt details',
    description: 'Returns account esdt for a given address. Proxy Type: Snapshotless',
  })
  async getAddressEsdt(@Param('address', ParseAddressPipe) address: string) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`address/${address}/esdt`, GatewayComponentRequest.addressDetails, undefined, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('account was not found')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/transaction/send')
  @ApiOperation({
    summary: 'Send transaction',
    description: 'Sends a transaction to the network. Proxy Type: Regular',
  })
  async transactionSend(@Body() body: any) {
    if (!body.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!body.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    const pluginTransaction = await this.pluginService.processTransactionSend(body);
    if (pluginTransaction) {
      return pluginTransaction;
    }

    // eslint-disable-next-line require-await
    return await this.gatewayPost('transaction/send', GatewayComponentRequest.sendTransaction, body, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('transaction generation failed')) {
        throw error;
      }

      return false;
    });
  }
  @Post('/transaction/simulate')
  @ApiOperation({
    summary: 'Simulate transaction',
    description: `Simulates a transaction's execution. Proxy Type: Regular`,
  })
  async transactionSimulate(@Body() body: any) {
    return await this.gatewayPost('transaction/simulate', GatewayComponentRequest.simulateTransaction, body);
  }

  @Post('/transaction/send-multiple')
  @ApiOperation({
    summary: 'Send multiple transactions',
    description: `Sends a bulk of transactions to the network. Proxy Type: Regular`,
  })
  async transactionSendMultiple(@Body() body: any) {
    return await this.gatewayPost('transaction/send-multiple', GatewayComponentRequest.sendTransactionMultiple, body);
  }

  @Post('/transaction/send-user-funds')
  @ApiOperation({
    summary: 'Send user funds',
    description: `Send funds transaction. Proxy Type: Regular`,
  })
  async transactionSendUserFunds(@Body() body: any) {
    return await this.gatewayPost('transaction/send-user-funds', GatewayComponentRequest.sendUserFunds, body);
  }

  @Post('/transaction/cost')
  @ApiOperation({
    summary: 'Transaction cost',
    description: `Returns transactions cost. Proxy Type: Regular`,
  })
  async transactionCost(@Body() body: any) {
    return await this.gatewayPost('transaction/cost', GatewayComponentRequest.transactionCost, body);
  }

  @Get('/transaction/pool')
  @ApiOperation({
    summary: 'Transaction pool',
    description: `Returns the transactions pool for all shards. Proxy Type: Regular`,
  })
  @NoCache()
  async getTransactionPool(@Req() request: Request) {
    const url = request.url.replace(/^\//, '');
    return await this.gatewayGet(url, GatewayComponentRequest.transactionPool);
  }

  @Get('/transaction/:hash')
  @ApiOperation({
    summary: 'Transaction details',
    description: `Returns the transaction details for a given transaction hash. Proxy Type: Regular`,
  })
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  @ApiQuery({ name: 'withResults', description: 'Include results which correspond to the hash', required: false })
  async getTransaction(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('withResults') withResults?: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}`, GatewayComponentRequest.transactionDetails, { sender, withResults });
  }

  @Get('/transaction/:hash/process-status')
  @ApiOperation({
    summary: 'Transaction process-status',
    description: `Returns process status for a given transaction hash. Proxy Type: Regular`,
  })
  async getTransactionProcessStatus(
    @Param('hash', ParseTransactionHashPipe) hash: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}/process-status`, GatewayComponentRequest.transactionProcessStatus);
  }

  @Get('/transaction/:hash/status')
  @ApiOperation({
    summary: 'Transaction status',
    description: `Returns status for a given transaction hash. Proxy Type: Regular`,
  })
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  async getTransactionStatus(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender: string,
  ) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`transaction/${hash}/status`, GatewayComponentRequest.transactionDetails, { sender }, async error => {
      const message = error.response?.data?.error;
      if (message === 'transaction not found') {
        throw error;
      }

      return false;
    });
  }

  @Post('/vm-values/hex')
  @ApiOperation({
    summary: 'Vm values hex',
    description: `Send a request to the virtual machines and retrives the result in a hex format. Proxy Type: Snapshotless`,
  })
  async vmValuesHex(@Body() body: any) {
    // eslint-disable-next-line require-await
    return await this.gatewayPost('vm-values/hex', GatewayComponentRequest.vmQuery, body, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('doGetVMValue: no return data')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/vm-values/string')
  @ApiOperation({
    summary: 'Vm values string',
    description: `Send a request to the virtual machines and retrives the result in a string format. Proxy Type: Snapshotless`,
  })
  async vmValuesString(@Body() body: any) {
    return await this.gatewayPost('vm-values/string', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/int')
  @ApiOperation({
    summary: 'Vm values integer',
    description: `Send a request to the virtual machines and retrives the result in a integer format. Proxy Type: Snapshotless`,
  })
  async vmValuesInt(@Body() body: any) {
    return await this.gatewayPost('vm-values/int', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/query')
  @ApiOperation({
    summary: 'Vm values query',
    description: `Send a request to the virtual machines and retrives the result including altered or deleted account during the request. Proxy Type: Snapshotless`,
  })
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query (legacy)',
  })
  async queryLegacy(@Body() query: VmQueryRequest) {
    try {
      return await this.vmQueryService.vmQueryFullResult(query.scAddress, query.funcName, query.caller, query.args, query.value);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/network/status/:shard')
  @ApiOperation({
    summary: 'Network status',
    description: `Returns the status metrics from an observer in the given shard. Proxy Type: Regular`,
  })
  async getNetworkStatusShard(@Param('shard') shard: string) {
    return await this.gatewayGet(`network/status/${shard}`, GatewayComponentRequest.networkStatus);
  }

  @Get('/network/config')
  @ApiOperation({
    summary: 'Network configuration',
    description: `Returns the configuration of the network from any observer. Proxy Type: Regular`,
  })
  async getNetworkConfig() {
    return await this.gatewayGet('network/config', GatewayComponentRequest.networkConfig);
  }

  @Get('/network/economics')
  @ApiOperation({
    summary: 'Network economics',
    description: `Returns the economics data metric from the last epoch. Proxy Type: Regular`,
  })
  async getNetworkEconomics() {
    return await this.gatewayGet('network/economics', GatewayComponentRequest.networkEconomics);
  }

  @Get('/node/heartbeatstatus')
  @ApiOperation({
    summary: 'Node heartbeatstatus',
    description: `Returns the heartbeat data from an observer from any shard. Proxy Type: Regular`,
  })
  @NoCache()
  async getNodeHeartbeatStatus(@Res() res: Response) {
    try {
      const heartbeatStatus = await this.cachingService.getOrSet(
        'heartbeatstatus',
        async () => {
          const result = await this.gatewayService.getRaw('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
          return result.data;
        },
        Constants.oneMinute() * 2,
      );

      res.type('application/json').send(heartbeatStatus);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/validator/statistics')
  @ApiOperation({
    summary: 'Validator statistics',
    description: `Returns the validator statistics data from an observer from any shard. Proxy Type: Regular`,
  })
  @NoCache()
  async getValidatorStatistics(@Res() res: Response) {
    try {
      const validatorStatistics = await this.cachingService.getOrSet(
        'validatorstatistics',
        async () => {
          const result = await this.gatewayService.getRaw('validator/statistics', GatewayComponentRequest.validatorStatistics);
          return result.data;
        },
        Constants.oneMinute() * 2,
      );

      res.type('application/json').send(validatorStatistics);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/block/:shard/by-nonce/:nonce')
  @ApiOperation({
    summary: 'Block details',
    description: `Return a block by nonce and shard. Proxy Type: Regular`,
  })
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndNonce(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-nonce/${nonce}`, GatewayComponentRequest.blockByNonce, { withTxs });
  }

  @Get('/block/:shard/by-hash/:hash')
  @ApiOperation({
    summary: 'Block details',
    description: `Returns a block by hash. Proxy Type: Regular`,
  })
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndHash(
    @Param('shard') shard: string,
    @Param('hash') hash: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-hash/${hash}`, GatewayComponentRequest.blockByHash, { withTxs });
  }

  @Get('/block-atlas/:shard/:nonce')
  @ApiOperation({
    summary: 'Block-atlas details',
    description: `Returns a block from a specified shard and at a specified nonce. Proxy Type: Regular`,
  })
  async getBlockAtlas(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    return await this.gatewayGet(`block-atlas/${shard}/${nonce}`, GatewayComponentRequest.blockAtlas);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  @ApiOperation({
    summary: 'Hyperblock details',
    description: `Returns the hyperblock at the specified nonce. Proxy Type: Regular`,
  })
  async getHyperblockByNonce(@Param('nonce') nonce: number) {
    try {
      return await this.cachingService.getOrSet(
        `hyperblock/by-nonce/${nonce}`,
        // eslint-disable-next-line require-await
        async () => await this.gatewayGet(`hyperblock/by-nonce/${nonce}`, GatewayComponentRequest.hyperblockByNonce, undefined, async error => {
          const message = error.response?.data?.error;
          if (message === 'sending request error') {
            throw error;
          }

          return false;
        }),
        Constants.oneHour(),
      );
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('/hyperblock/by-hash/:hash')
  @ApiOperation({
    summary: 'Hyperblock details',
    description: `Returns the hyperblock with the specific hash. Proxy Type: Regular`,
  })
  async getHyperblockByHash(@Param('hash', ParseBlockHashPipe) hash: number) {
    return await this.gatewayGet(`hyperblock/by-hash/${hash}`, GatewayComponentRequest.hyperblockByHash);
  }

  @Get('/network/gas-configs')
  @ApiOperation({
    summary: 'Network gas configuration',
    description: `Returns the gas costs configuration available in the network. Proxy Type: Regular`,
  })
  async getGasConfigs() {
    return await this.gatewayGet('network/gas-configs', GatewayComponentRequest.gasConfigs);
  }

  private async gatewayGet(url: string, component: GatewayComponentRequest, params: any = undefined, errorHandler?: (error: any) => Promise<boolean>) {
    if (params) {
      url += '?' + Object.keys(params).filter(key => params[key] !== undefined).map(key => `${key}=${params[key]}`).join('&');
    }

    try {
      const result = await this.gatewayService.getRaw(url, component, errorHandler);
      return result.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.data) {
          throw new BadRequestException(error.response.data);
        }

        throw new BadRequestException(error.response);
      }

      this.logger.error(`Unhandled exception when calling gateway url '${url}'`);
      throw new BadRequestException(`Unhandled exception when calling gateway url '${url}'`);
    }
  }

  private async gatewayPost(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>) {
    try {
      const result = await this.gatewayService.createRaw(url, component, data, errorHandler);
      return result.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.data) {
          throw new BadRequestException(error.response.data);
        }

        throw new BadRequestException(error.response);
      }

      this.logger.error(`Unhandled exception when calling gateway url '${url}'`);
      throw new BadRequestException(`Unhandled exception when calling gateway url '${url}'`);
    }
  }
}
