import { IsOptional, IsString } from 'class-validator';

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
