// block-subscribe.dto.ts
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { SortOrder } from 'src/common/entities/sort.order';

export class BlockSubscribePayload {
    @IsOptional()
    @IsNumber()
    @Min(0)
    shard?: number;

    @IsOptional()
    @IsString()
    proposer?: string;

    @IsOptional()
    @IsString()
    validator?: string;

    @IsOptional()
    @IsNumber()
    epoch?: number;

    @IsOptional()
    @IsNumber()
    nonce?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hashes?: string[];

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder;

    @IsOptional()
    @IsNumber()
    @Min(0)
    from?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    size?: number;

    @IsOptional()
    @IsBoolean()
    withProposerIdentity?: boolean;
}
