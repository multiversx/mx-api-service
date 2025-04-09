import { JwtAdminGuard, NativeAuthGuard } from "@multiversx/sdk-nestjs-auth";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Put, UseGuards } from "@nestjs/common";
import { ApiExcludeController, ApiResponse } from "@nestjs/swagger";
import { CacheValue } from "./entities/cache.value";

@Controller('debug/cache/local')
@ApiExcludeController()
export class LocalCacheController {
  constructor(
    private readonly cachingService: CacheService,
  ) { }

  @UseGuards(NativeAuthGuard, JwtAdminGuard)
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
    const value = await this.cachingService.getLocal(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(value);
  }

  @UseGuards(NativeAuthGuard, JwtAdminGuard)
  @Put("/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  setCache(@Param('key') key: string, @Body() cacheValue: CacheValue) {
    this.cachingService.setLocal(key, cacheValue.value, cacheValue.ttl);
  }

  @UseGuards(NativeAuthGuard, JwtAdminGuard)
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
    await this.cachingService.deleteLocal(key);
  }
}
