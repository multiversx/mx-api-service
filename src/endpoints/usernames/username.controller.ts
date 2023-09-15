import { AccountUsername } from './entities/account.username';
import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsernameService } from "./username.service";
import { NoCache } from '@multiversx/sdk-nestjs-cache';
import { AccountService } from '../accounts/account.service';
import { ParseBoolPipe } from '@multiversx/sdk-nestjs-common';
import { AccountDetailed } from '../accounts/entities/account.detailed';

@Controller()
@ApiTags('usernames')
export class UsernameController {
  constructor(
    private readonly usernameService: UsernameService,
    private readonly accountService: AccountService,
  ) { }

  @Get("/usernames/:username")
  @ApiOperation({ summary: 'Account details by username', description: 'Returns account details for a given username. Performs a redirect on the proper account address' })
  @ApiOkResponse({ type: AccountUsername })
  @ApiNotFoundResponse({ description: 'Username not found' })

  @NoCache()
  async getUsernameDetails(
    @Param('username') username: string,
    @Query('withGuardianInfo', new ParseBoolPipe) withGuardianInfo: boolean
  ): Promise<AccountDetailed | null> {
    const address = await this.usernameService.getAddressForUsername(username);
    if (!address) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return await this.accountService.getAccount(address, undefined, withGuardianInfo);
  }
}
