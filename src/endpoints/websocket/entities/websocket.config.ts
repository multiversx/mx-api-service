import { ApiProperty } from "@nestjs/swagger";

export class WebsocketConfig {
  @ApiProperty({ type: String })
  url: string = '';
}
