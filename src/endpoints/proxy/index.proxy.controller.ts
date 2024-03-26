import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
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
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_search`;
    const queryParams = request.query;

    const { data } = await this.apiService.get(url, { params: queryParams });

    return data;
  }

  @Get('/:collection/_count')
  async forwardIndexCountGet(
    @Param('collection') collection: string,
    @Req() request: Request,
  ) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;
    const queryParams = request.query;

    const { data } = await this.apiService.get(url, { params: queryParams });

    return data;
  }

  @Post('/:collection/_search')
  async forwardIndexSearchPost(
    @Param('collection') collection: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_search`;
    const queryParams = request.query;

    const { data } = await this.apiService.post(url, body, { params: queryParams });

    return data;
  }

  @Post('/:collection/_count')
  async forwardIndexCountPost(
    @Param('collection') collection: string,
    @Body() body: any,
    @Req() request: Request,
  ) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;
    const queryParams = request.query;

    const { data } = await this.apiService.post(url, body, { params: queryParams });

    return data;
  }
}
