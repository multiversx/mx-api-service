import { IsOptional, IsString } from 'class-validator';
import { DisallowedFieldCombination } from 'src/utils/disallowed.field.combination.constraint';
import { NoEmptyPayload } from 'src/utils/no.empty.payload.validator';

@NoEmptyPayload({ message: `You must add at least one filter from ${TransferCustomSubscribePayload.getClassFields()}` })
@DisallowedFieldCombination()
export class TransferCustomSubscribePayload {
  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  relayer?: string;

  @IsOptional()
  @IsString()
  function?: string;

  @IsOptional()
  @IsString()
  address?: string; // sender OR receiver OR relayer. throw error if sender, receiver or relayer is already set

  @IsOptional()
  @IsString()
  token?: string;

  public static getClassFields(): string[] {
    return ['function', 'receiver', 'sender', 'relayer', 'address', 'token'];
  }

  public static getFieldsSubstitutions(): Record<string, string[]> {
    return {
      address: ['sender', 'receiver', 'relayer'],
    };
  }
}
