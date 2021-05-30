import { ApiProperty } from "@nestjs/swagger";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";

export class Node {
    @ApiProperty()
    bls: string = '';

    @ApiProperty()
    name: string = '';

    @ApiProperty()
    version: string = '';

    @ApiProperty()
    rating: number = 0;

    @ApiProperty()
    tempRating: number = 0;

    @ApiProperty()
    ratingModifier: number = 0;

    @ApiProperty()
    uptimeSec: number = 0;

    @ApiProperty()
    downtimeSec: number = 0;

    @ApiProperty()
    shard: number | undefined = undefined;

    @ApiProperty()
    type: NodeType | undefined = undefined;

    @ApiProperty()
    status: NodeStatus | undefined = undefined;

    @ApiProperty()
    online: boolean = false;

    @ApiProperty()
    nonce: number = 0;

    @ApiProperty()
    instances: number = 0;

    @ApiProperty()
    uptime: number = 0;

    @ApiProperty()
    downtime: number = 0;

    @ApiProperty()
    owner: string = '';

    @ApiProperty()
    identity: string | undefined = undefined;

    @ApiProperty()
    provider: string = '';

    @ApiProperty()
    issues: string[] = [];

    @ApiProperty()
    stake: string = '';

    @ApiProperty()
    topUp: string = '';

    @ApiProperty()
    locked: string = '';

    @ApiProperty()
    leaderFailure: number = 0;

    @ApiProperty()
    leaderSuccess: number = 0;

    @ApiProperty()
    validatorFailure: number = 0;

    @ApiProperty()
    validatorIgnoredSignatures: number = 0;

    @ApiProperty()
    validatorSuccess: number = 0;

    @ApiProperty()
    position: number = 0;
}