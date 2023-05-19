import { AccountUsername } from './entities/account.username';
import { Controller, Get, HttpException, HttpStatus, Param, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsernameService } from "./username.service";
import { NoCache } from '@multiversx/sdk-nestjs-cache';

@Controller()
@ApiTags('usernames')
export class UsernameController {
  constructor(private readonly usernameService: UsernameService) { }

  @Get("/usernames/:username")
  @ApiOperation({ summary: 'Account details by username', description: 'Returns account details for a given username. Performs a redirect on the proper account address' })
  @ApiOkResponse({ type: AccountUsername })
  @ApiNotFoundResponse({ description: 'Username not found' })

  @NoCache()
  async getUsernameDetails(@Param('username') username: string, @Res() res: any): Promise<any> {
    const address = await this.usernameService.getAddressForUsername(username);
    if (!address) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return res.redirect(`/accounts/${address}`);
  }
}
