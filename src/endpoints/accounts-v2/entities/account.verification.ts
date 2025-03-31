import { ApiProperty } from '@nestjs/swagger';
import { AccountVerificationSource } from './account.verification.source';
import { AccountVerificationStatus } from './account.verification.status';

export class AccountVerification {
  constructor(init?: Partial<AccountVerification>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Source code hash' })
  codeHash?: string = '';

  @ApiProperty({ description: 'Source code of contract', type: AccountVerificationSource, required: false })
  source?: any;

  @ApiProperty({ description: 'Verifier process status', enum: AccountVerificationStatus })
  status!: AccountVerificationStatus;

  @ApiProperty({ description: 'File hash for IPFS', required: false })
  ipfsFileHash?: string;
}
