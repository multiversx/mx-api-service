import { IsOptional, IsString } from 'class-validator';
import { NoEmptyPayload } from 'src/utils/no.empty.payload.validator';

@NoEmptyPayload({ message: `You must add at least one filter from ${EventsCustomSubscribePayload.getClassFields()}` })
export class EventsCustomSubscribePayload {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  logAddress?: string;

  public static getClassFields(): string[] {
    return ['address', 'identifier', 'logAddress'];
  }
}
