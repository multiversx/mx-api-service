import { IsOptional, IsString, IsArray, IsBoolean, IsNumber, IsEnum, Min, Max, IsIn } from 'class-validator';
import { TransactionStatus } from '../transaction.status';
import { SortOrder } from 'src/common/entities/sort.order';

export class TransactionSubscribePayload {
    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder;

    @IsOptional()
    @IsBoolean()
    isRelayed?: boolean;

    @IsOptional()
    @IsBoolean()
    isScCall?: boolean;

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
    @IsIn([0], { message: 'from can only be 0' })
    from?: number = 0;

    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'minimum size is 1' })
    @Max(50, { message: 'maximum size is 50' })
    size?: number = 25;


    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    fields?: string[];
}
