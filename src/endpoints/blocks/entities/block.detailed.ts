import { ApiProperty } from "@nestjs/swagger";
import { Block } from "./block";

export class BlockDetailed extends Block {
    @ApiProperty()
    miniBlocksHashes: string[] = [];

    @ApiProperty()
    notarizedBlocksHashes: string[] = [];

    @ApiProperty()
    validators: string[] = [];
}
