import { Controller, Get, NotFoundException, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AccountServiceV2 } from './account.service.v2';
import { AccountDetailed } from './entities/account.detailed';
import { ParseAddressPipe, ParseBoolPipe, ParseIntPipe } from '@multiversx/sdk-nestjs-common';
import { DeepHistoryInterceptor } from 'src/interceptors/deep-history.interceptor';
import { AccountFetchOptions } from './entities/account.fetch.options';
import { NoCache } from '@multiversx/sdk-nestjs-cache';

@Controller('')
@ApiTags('accounts')
export class AccountControllerV2 {

  constructor(
    private readonly accountServiceV2: AccountServiceV2,
  ) { }

  @Get("/v2/accounts/:address")
  @UseInterceptors(DeepHistoryInterceptor)
  @ApiOperation({ summary: 'Account details', description: 'Returns account details for a given address' })
  @ApiQuery({ name: 'withGuardianInfo', description: 'Returns guardian data for a given address', required: false })
  @ApiQuery({ name: 'withTxCount', description: 'Returns the count of the transactions for a given address', required: false })
  @ApiQuery({ name: 'withScrCount', description: 'Returns the sc results count for a given address', required: false })
  @ApiQuery({ name: 'withTimestamp', description: 'Returns the timestamp of the last activity for a given address', required: false })
  @ApiQuery({ name: 'withAssets', description: 'Returns the assets for a given address', required: false })
  @ApiQuery({ name: 'timestamp', description: 'Retrieve entry from timestamp', required: false, type: Number })
  @ApiOkResponse({ type: AccountDetailed })
  @NoCache()
  async getAccountDetails(
    @Param('address', ParseAddressPipe) address: string,
    @Query('withGuardianInfo', ParseBoolPipe) withGuardianInfo?: boolean,
    @Query('withTxCount', ParseBoolPipe) withTxCount?: boolean,
    @Query('withScrCount', ParseBoolPipe) withScrCount?: boolean,
    @Query('withTimestamp', ParseBoolPipe) withTimestamp?: boolean,
    @Query('withAssets', ParseBoolPipe) withAssets?: boolean,
    @Query('timestamp', ParseIntPipe) _timestamp?: number,
  ): Promise<AccountDetailed> {
    const account = await this.accountServiceV2.getAccount(
      address,
      new AccountFetchOptions({ withGuardianInfo, withTxCount, withScrCount, withTimestamp, withAssets }),
    );
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }
}
