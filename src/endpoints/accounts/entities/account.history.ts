import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";

export class AccountHistory {
    @ApiProperty({ type: String })
    address: string = '';

    @ApiProperty(SwaggerUtils.amountPropertyOptions())
    balance: string = '';

    @ApiProperty({ type: Number })
    timestamp: number = 0;

    @ApiProperty({ type: Boolean, nullable: true })
    isSender?: boolean | undefined = undefined;
}
