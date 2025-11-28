import { IsOptional, IsString } from 'class-validator';

export class TransactionCustomSubscribePayload {
  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  function?: string;
}
