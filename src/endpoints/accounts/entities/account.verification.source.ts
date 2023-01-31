import { ApiProperty } from '@nestjs/swagger';

export class AccountVerificationSource {
  constructor(init?: Partial<AccountVerificationSource>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Abi file source' })
  abi: any = '';

  @ApiProperty({ description: 'Contract source code' })
  contract: any = '';
}
