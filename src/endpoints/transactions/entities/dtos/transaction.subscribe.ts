import { IsOptional, IsString, IsArray, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '../transaction.status';
import { QueryConditionOptions } from '@multiversx/sdk-nestjs-elastic';
import { SortOrder } from 'src/common/entities/sort.order';

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
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    before?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    after?: number;

    @IsOptional()
    @IsEnum(QueryConditionOptions)
    condition?: QueryConditionOptions;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder;

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
