import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("NetworkConstants", { description: "NetworkConstants object type." })
export class NetworkConstants {
  constructor(init?: Partial<NetworkConstants>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "ChainId details." })
  @ApiProperty({ description: 'The chain identifier' })
  chainId: string = '';

  @Field(() => Float, { description: "GasPerDataByte details." })
  @ApiProperty({ description: 'Gas per data byte' })
  gasPerDataByte: number = 0;

  @Field(() => Float, { description: "MinGasLimit details." })
  @ApiProperty({ description: 'Minimum gas limit' })
  minGasLimit: number = 0;

  @Field(() => Float, { description: "MinGasPrice details." })
  @ApiProperty({ description: 'Minimum gas price' })
  minGasPrice: number = 0;

  @Field(() => Float, { description: "MinTransactionVersion details." })
  @ApiProperty({ description: 'Minimum transaction version' })
  minTransactionVersion: number = 0;
}
