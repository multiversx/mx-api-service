import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NftTag } from './entities/nft.tag';
import { NftTagsService } from './nfttags.service';


@Controller()
@ApiTags('nfttags')
export class NftTagsController {
  constructor(
    private readonly nftTagsService: NftTagsService,
  ) {}

  @Get("/nfttags")
  @ApiResponse({
    status: 200,
    description: 'The nft tags available',
    type: NftTag,
    isArray: true
  })
  @ApiQuery({ name: 'from', description: 'Numer of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false  })
  getAccounts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number, 
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<NftTag[]> {
    return this.nftTagsService.getNftTags({from, size});
  }

  @Get("/nfttags/:tag")
  @ApiResponse({
    status: 200,
    description: 'The details of a given nft tag',
    type: NftTag
  })
  @ApiResponse({
    status: 404,
    description: 'Nft tag not found'
  })
  async getAccountDetails(@Param('tag') tag: string): Promise<NftTag> {
    try {
      return await this.nftTagsService.getNftTag(tag);
    } catch {
      throw new HttpException('Nft tag not found', HttpStatus.NOT_FOUND);
    }
  }
}
