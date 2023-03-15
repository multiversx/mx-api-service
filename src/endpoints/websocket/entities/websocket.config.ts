import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("WebsocketConfig", { description: "WebsocketConfig object type." })
export class WebsocketConfig {

  @Field(() => String, { description: "Cluster url." })
  @ApiProperty({ type: String })
  url: string = '';

  @Field(() => String, { description: "Event notifier url.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  eventNotifierUrl: string | undefined = undefined;
}
