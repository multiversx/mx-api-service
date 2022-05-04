import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";

export class BlockDetailed extends Block {
    @ApiProperty({ type: [String] })
    miniBlocksHashes: string[] = [];

    @ApiProperty({ type: [String] })
    notarizedBlocksHashes: string[] = [];

    @ApiProperty({ type: [String] })
    validators: string[] = [];
}
