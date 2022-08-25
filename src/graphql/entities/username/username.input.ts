import { Field, InputType } from "@nestjs/graphql";

@InputType({ description: "Input to retrieve the given account details for." })
export class GetUsernameInput {
  constructor(partial?: Partial<GetUsernameInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "username", description: "Herotag" })
  username: string = "";

  public static resolve(input: GetUsernameInput): string {
    return input.username;
  }
}
