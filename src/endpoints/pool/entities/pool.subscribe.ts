// block-subscribe.dto.ts
import { IsOptional, IsNumber, Min, Max, IsEnum, IsIn } from 'class-validator';
import { TransactionType } from 'src/endpoints/transactions/entities/transaction.type';

export class PoolSubscribePayload {
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @IsOptional()
    @IsNumber()
    @IsIn([0], { message: 'from can only be 0' })
    from?: number = 0;

    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'minimum size is 1' })
    @Max(50, { message: 'maximum size is 50' })
    size?: number = 25;
}
