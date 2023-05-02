import { JwtAdminGuard, NativeAuthGuard } from "@multiversx/sdk-nestjs-auth";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Put, Query, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiExcludeController, ApiResponse } from "@nestjs/swagger";
import { CacheValue } from "./entities/cache.value";

@Controller('debug/cache/remote')
@ApiExcludeController()
export class RemoteCacheController {
  constructor(
    private readonly cachingService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
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
    const value = await this.cachingService.getRemote(key);
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
  async setCache(@Param('key') key: string, @Body() cacheValue: CacheValue) {
    await this.cachingService.setRemote(key, cacheValue.value, cacheValue.ttl);
    this.clientProxy.emit('deleteCacheKeys', [key]);
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
    const keys = await this.cachingService.deleteInCache(key);
    this.clientProxy.emit('deleteCacheKeys', keys);
  }

  @UseGuards(NativeAuthGuard, JwtAdminGuard)
  @Get("/")
  async getKeys(
    @Query('keys') keys: string | undefined,
  ): Promise<string[]> {
    return keys ? await this.cachingService.getKeys(keys) : [];
  }
}
