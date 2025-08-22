import { IsOptional, IsString, IsArray, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionSubscribePayload {
    @IsOptional()
    @IsString()
    sender?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    receiver?: string[];

    @IsOptional()
    @IsString()
    token?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    functions?: string[];

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    senderShard?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    receiverShard?: number;

    @IsOptional()
    @IsString()
    miniBlockHash?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hashes?: string[];

    @IsOptional()
    @IsIn(['success', 'failed', 'pending'])
    status?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    before?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    after?: number;

    @IsOptional()
    @IsString()
    condition?: string;

    @IsOptional()
    @IsString()
    order?: string;

    @IsOptional()
    @IsString()
    relayer?: string;

    @IsOptional()
    @IsBoolean()
    isRelayed?: boolean;

    @IsOptional()
    @IsBoolean()
    isScCall?: boolean;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    round?: number;

    @IsOptional()
    @IsBoolean()
    withScResults?: boolean;

    @IsOptional()
    @IsBoolean()
    withRelayedScresults?: boolean;

    @IsOptional()
    @IsBoolean()
    withOperations?: boolean;

    @IsOptional()
    @IsBoolean()
    withLogs?: boolean;

    @IsOptional()
    @IsBoolean()
    withScamInfo?: boolean;

    @IsOptional()
    @IsBoolean()
    withUsername?: boolean;

    @IsOptional()
    @IsBoolean()
    withBlockInfo?: boolean;

    @IsOptional()
    @IsBoolean()
    withActionTransferValue?: boolean;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    from?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    size?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    fields?: string[];
}
