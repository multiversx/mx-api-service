import { AccountUsername } from './entities/accountUsername';
import { Controller, Get, HttpException, HttpStatus, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NoCache } from "src/decorators/no.cache";
import { UsernameService } from "./username.service";

@Controller()
@ApiTags('usernames')
export class UsernameController {
  constructor(private readonly usernameService: UsernameService) { }

  @Get("/usernames/:username")
  @ApiOperation({ summary: 'Account details', description: 'Returns account details for a given username' })
  @ApiResponse({
    status: 200,
    description: 'The details of a given username',
    type: AccountUsername,
  })
  @ApiResponse({
    status: 404,
    description: 'Username not found',
  })
  @NoCache()
  async getUsernameDetails(@Param('username') username: string, @Res() res: any): Promise<any> {
    const address = await this.usernameService.getUsernameAddressRaw(username);
    if (!address) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return res.redirect(`/accounts/${address}`);
  }
}
