import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Query, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "../vm.query/entities/vm.query.request";
import { VmQueryService } from "../vm.query/vm.query.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { Response } from "express";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { PluginService } from "src/common/plugins/plugin.service";
import { Constants, ParseAddressPipe, ParseBlockHashPipe, ParseTransactionHashPipe, CachingService, NoCache } from "@elrondnetwork/nestjs-microservice-common";

@Controller()
@ApiTags('proxy')
export class ProxyController {
  private readonly logger: Logger;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    private readonly pluginService: PluginService,
  ) {
    this.logger = new Logger(ProxyController.name);
  }

  @Get('/address/:address')
  @ApiExcludeEndpoint()
  async getAddress(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}`, GatewayComponentRequest.addressDetails);
  }

  @Get('/address/:address/balance')
  @ApiExcludeEndpoint()
  async getAddressBalance(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/balance`, GatewayComponentRequest.addressBalance);
  }

  @Get('/address/:address/nonce')
  @ApiExcludeEndpoint()
  async getAddressNonce(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/nonce`, GatewayComponentRequest.addressNonce);
  }

  @Get('/address/:address/shard')
  @ApiExcludeEndpoint()
  async getAddressShard(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/shard`, GatewayComponentRequest.addressShard);
  }

  @Get('/address/:address/storage/:key')
  @ApiExcludeEndpoint()
  async getAddressStorageKey(@Param('address', ParseAddressPipe) address: string, @Param('key') key: string) {
    return await this.gatewayGet(`address/${address}/storage/${key}`, GatewayComponentRequest.addressStorage);
  }

  @Get('/address/:address/transactions')
  @ApiExcludeEndpoint()
  async getAddressTransactions(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/transactions`, GatewayComponentRequest.addressTransactions);
  }

  @Get('/address/:address/esdt')
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
  async transactionSimulate(@Body() body: any) {
    return await this.gatewayPost('transaction/simulate', GatewayComponentRequest.simulateTransaction, body);
  }

  @Post('/transaction/send-multiple')
  @ApiExcludeEndpoint()
  async transactionSendMultiple(@Body() body: any) {
    return await this.gatewayPost('transaction/send-multiple', GatewayComponentRequest.sendTransactionMultiple, body);
  }

  @Post('/transaction/send-user-funds')
  @ApiExcludeEndpoint()
  async transactionSendUserFunds(@Body() body: any) {
    return await this.gatewayPost('transaction/send-user-funds', GatewayComponentRequest.sendUserFunds, body);
  }

  @Post('/transaction/cost')
  @ApiExcludeEndpoint()
  async transactionCost(@Body() body: any) {
    return await this.gatewayPost('transaction/cost', GatewayComponentRequest.transactionCost, body);
  }

  @Get('/transaction/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  @ApiQuery({ name: 'withResults', description: 'Include results which correspond to the hash', required: false })
  async getTransaction(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('withResults') withResults?: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}`, GatewayComponentRequest.transactionDetails, { sender, withResults });
  }

  @Get('/transaction/:hash/status')
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
  async vmValuesHex(@Body() body: any) {
    return await this.gatewayPost('vm-values/hex', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/string')
  @ApiExcludeEndpoint()
  async vmValuesString(@Body() body: any) {
    return await this.gatewayPost('vm-values/string', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/int')
  @ApiExcludeEndpoint()
  async vmValuesInt(@Body() body: any) {
    return await this.gatewayPost('vm-values/int', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/query')
  @ApiExcludeEndpoint()
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
  @ApiExcludeEndpoint()
  async getNetworkStatusShard(@Param('shard') shard: string) {
    return await this.gatewayGet(`network/status/${shard}`, GatewayComponentRequest.networkStatus);
  }

  @Get('/network/config')
  @ApiExcludeEndpoint()
  async getNetworkConfig() {
    return await this.gatewayGet('network/config', GatewayComponentRequest.networkConfig);
  }

  @Get('/network/economics')
  @ApiExcludeEndpoint()
  async getNetworkEconomics() {
    return await this.gatewayGet('network/economics', GatewayComponentRequest.networkEconomics);
  }

  @Get('/network/total-staked')
  @ApiExcludeEndpoint()
  async getNetworkTotalStaked() {
    return await this.gatewayGet('network/total-staked', GatewayComponentRequest.networkTotalStaked);
  }

  @Get('/node/heartbeatstatus')
  @ApiExcludeEndpoint()
  @NoCache()
  async getNodeHeartbeatStatus(@Res() res: Response) {
    try {
      const heartbeatStatus = await this.cachingService.getOrSetCache(
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
  @ApiExcludeEndpoint()
  @NoCache()
  async getValidatorStatistics(@Res() res: Response) {
    try {
      const validatorStatistics = await this.cachingService.getOrSetCache(
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
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndNonce(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-nonce/${nonce}`, GatewayComponentRequest.blockByNonce, { withTxs });
  }

  @Get('/block/:shard/by-hash/:hash')
  @ApiExcludeEndpoint()
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndHash(
    @Param('shard') shard: string,
    @Param('hash') hash: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-hash/${hash}`, GatewayComponentRequest.blockByHash, { withTxs });
  }

  @Get('/block-atlas/:shard/:nonce')
  @ApiExcludeEndpoint()
  async getBlockAtlas(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    return await this.gatewayGet(`block-atlas/${shard}/${nonce}`, GatewayComponentRequest.blockAtlas);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  @ApiExcludeEndpoint()
  async getHyperblockByNonce(@Param('nonce') nonce: number) {
    try {
      return await this.cachingService.getOrSetCache(
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
  @ApiExcludeEndpoint()
  async getHyperblockByHash(@Param('hash', ParseBlockHashPipe) hash: number) {
    return await this.gatewayGet(`hyperblock/by-hash/${hash}`, GatewayComponentRequest.hyperblockByHash);
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
