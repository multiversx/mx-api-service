import { IsOptional, IsNumber, IsBoolean, Min, Max, IsEnum, IsIn } from 'class-validator';
import { SortOrder } from 'src/common/entities/sort.order';

export class BlockSubscribePayload {
    @IsOptional()
    @IsNumber()
    @Min(0)
    shard?: number;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder;

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
    @IsBoolean()
    withProposerIdentity?: boolean;
}
