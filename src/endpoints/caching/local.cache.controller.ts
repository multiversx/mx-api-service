import { CachingService, JwtAdminGuard, JwtAuthenticateGuard } from "@elrondnetwork/erdnest";
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Put, UseGuards } from "@nestjs/common";
import { ApiExcludeController, ApiResponse } from "@nestjs/swagger";
import { CacheValue } from "./entities/cache.value";

@Controller('debug/cache/local')
@ApiExcludeController()
export class LocalCacheController {
  constructor(
    private readonly cachingService: CachingService,
  ) { }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Get("/:key")
  @ApiResponse({
    status: 200,
    description: 'The cache value for one key',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async getCache(@Param('key') key: string): Promise<unknown> {
    const value = await this.cachingService.getCacheLocal(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(value);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Put("/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  async setCache(@Param('key') key: string, @Body() cacheValue: CacheValue) {
    await this.cachingService.setCacheLocal(key, cacheValue.value, cacheValue.ttl);
  }

  @UseGuards(JwtAuthenticateGuard, JwtAdminGuard)
  @Delete("/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been deleted from cache',
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async delCache(@Param('key') key: string) {
    await this.cachingService.deleteInCacheLocal(key);
  }
}
