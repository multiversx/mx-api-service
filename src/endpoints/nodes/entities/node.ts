import { ApiProperty } from "@nestjs/swagger";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";

export class Node {
    @ApiProperty({ type: String })
    bls: string = '';

    @ApiProperty({ type: String })
    name: string = '';

    @ApiProperty({ type: String, default: 0 })
    version: string = '';

    @ApiProperty({ type: Number })
    rating: number = 0;

    @ApiProperty({ type: Number })
    tempRating: number = 0;

    @ApiProperty({ type: Number })
    ratingModifier: number = 0;

    @ApiProperty({ type: Number, nullable: true })
    shard: number | undefined = undefined;

    @ApiProperty({ enum: NodeType, nullable: true })
    type: NodeType | undefined = undefined;

    @ApiProperty({ enum: NodeStatus, nullable: true })
    status: NodeStatus | undefined = undefined;

    @ApiProperty({ type: Boolean, default: false })
    online: boolean = false;

    @ApiProperty({ type: Number })
    nonce: number = 0;

    @ApiProperty({ type: Number })
    instances: number = 0;

    @ApiProperty({ type: String })
    owner: string = '';

    @ApiProperty({ type: String, nullable: true })
    identity: string | undefined = undefined;

    @ApiProperty({ type: String })
    provider: string = '';

    @ApiProperty({ type: [String] })
    issues: string[] = [];

    @ApiProperty({ type: String, default: 0 })
    stake: string = '';

    @ApiProperty({ type: String, default: 0 })
    topUp: string = '';

    @ApiProperty({ type: String, default: 0 })
    locked: string = '';

    @ApiProperty({ type: Number })
    leaderFailure: number = 0;

    @ApiProperty({ type: Number })
    leaderSuccess: number = 0;

    @ApiProperty({ type: Number })
    validatorFailure: number = 0;

    @ApiProperty({ type: Number })
    validatorIgnoredSignatures: number = 0;

    @ApiProperty({ type: Number })
    validatorSuccess: number = 0;

    @ApiProperty({ type: Number })
    position: number = 0;
}
