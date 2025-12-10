import { IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class EventsSubscribePayload {
    @IsOptional()
    @IsNumber()
    @Min(0)
    shard?: number;

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
