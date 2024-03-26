import { Body, Controller, Get, HttpException, Param, Post, Req } from "@nestjs/common";
import { ApiExcludeController, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ApiService, DisableFieldsInterceptorOnController } from "@multiversx/sdk-nestjs-http";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Controller('index')
@ApiTags('proxy')
@ApiExcludeController()
@DisableFieldsInterceptorOnController()
export class IndexProxyController {
  constructor(
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  @Get('/:collection/_search')
  async forwardIndexSearchGet(
    @Param('collection') collection: string,
    @Req() request: Request,
  ) {
    return await this.performIndexGetRequest(collection, '_search', request.query);
  }

  @Get('/:collection/_count')
  async forwardIndexCountGet(
    @Param('collection') collection: string,
    @Req() request: Request,
  ) {
    return await this.performIndexGetRequest(collection, '_count', request.query);
  }

  @Post('/:collection/_search')
  async forwardIndexSearchPost(
    @Param('collection') collection: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    return await this.performIndexPostRequest(collection, '_search', request.query, body);
  }

  @Post('/:collection/_count')
  async forwardIndexCountPost(
    @Param('collection') collection: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    return await this.performIndexPostRequest(collection, '_count', request.query, body);
  }

  private async performIndexGetRequest(collection: string, suffix: string, params: any) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/${suffix}`;

    try {
      const { data } = await this.apiService.get(url, { params });

      return data;
    } catch (error) {
      // @ts-ignore
      throw new HttpException(error.response, error.status);
    }
  }

  private async performIndexPostRequest(collection: string, suffix: string, params: any, body: any) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/${suffix}`;

    try {
      const { data } = await this.apiService.post(url, body, { params });

      return data;
    } catch (error) {
      // @ts-ignore
      throw new HttpException(error.response, error.status);
    }
  }
}
