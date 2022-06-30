import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";

export class ProviderUnstakedTokens {
    @ApiProperty(SwaggerUtils.amountPropertyOptions())
    amount: string = '';

    @ApiProperty({ type: Number, nullable: true })
    expires: number | undefined = undefined;

    @ApiProperty({ type: Number, nullable: true })
    epochs: number | undefined;
}
