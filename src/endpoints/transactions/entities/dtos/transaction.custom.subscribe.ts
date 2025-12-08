import { IsOptional, IsString } from 'class-validator';
import { NoEmptyPayload } from 'src/utils/no.empty.payload.validator';

@NoEmptyPayload({ message: `You must add at least one filter from ${TransactionCustomSubscribePayload.getClassFields()}` })
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

  public static getClassFields(): string[] {
    return ['function', 'receiver', 'sender'];
  }
}
