import { Controller, Get, Param } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { base64DecodeBinary, bech32Decode } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

@Controller()
@ApiTags('multisig')
export class MultisigController {
  constructor(private readonly vmQueryService: VmQueryService) {}

  @Get("/multisig/boardMembers")
  @ApiResponse({
    status: 200,
    description: 'Count of board members',
    type: 'number'
  })
  async getBoardMembers(): Promise<number> {
    let result = await this.vmQueryService.vmQuery(
      'erd1qqqqqqqqqqqqqpgqta8u7qyngjttwu9cmh7uvskaentglrqlerms7a3gys',
      'getNumBoardMembers',
      ''
    );

    let boardMembers = base64DecodeBinary(result[0]).readUInt8();
    return boardMembers;
  }

  @Get("/multisig/proposers")
  @ApiResponse({
    status: 200,
    description: 'Count of proposers',
    type: 'number'
  })
  async getProposers(): Promise<number> {
    let result = await this.vmQueryService.vmQuery(
      'erd1qqqqqqqqqqqqqpgqta8u7qyngjttwu9cmh7uvskaentglrqlerms7a3gys',
      'getNumProposers',
      '',
    );

    if (result[0] === '') {
      return 0;
    }

    let boardMembers = base64DecodeBinary(result[0]).readUInt8();
    return boardMembers;
  }

  @Get("/multisig/quorumSize")
  @ApiResponse({
    status: 200,
    description: 'Get quorum size',
    type: 'number'
  })
  async getQuorumSize(): Promise<number> {
    let result = await this.vmQueryService.vmQuery(
      'erd1qqqqqqqqqqqqqpgqta8u7qyngjttwu9cmh7uvskaentglrqlerms7a3gys',
      'getQuorum',
      ''
    );

    let boardMembers = base64DecodeBinary(result[0]).readUInt8();
    return boardMembers;
  }

  @Get("/multisig/userRole/:address")
  @ApiResponse({
    status: 200,
    description: 'Get user role',
    type: 'number'
  })
  async getUserRole(@Param('address') address: string): Promise<number> {
    let result = await this.vmQueryService.vmQuery(
      'erd1qqqqqqqqqqqqqpgqta8u7qyngjttwu9cmh7uvskaentglrqlerms7a3gys',
      'userRole',
      '',
      [ bech32Decode(address) ]
    );

    let boardMembers = base64DecodeBinary(result[0]).readUInt8();
    return boardMembers;
  }
}