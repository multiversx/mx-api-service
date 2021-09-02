import { Address } from '@elrondnetwork/erdjs/out';
import { Injectable } from '@nestjs/common';
import { TransactionDetailed } from '../entities/transaction.detailed';

@Injectable()
export class PotentialScamTransactionChecker {
  readonly minDataLength: number = 10;

  check(transaction: TransactionDetailed): boolean {
    const { receiver, data } = transaction;
    return this.isDataLengthValid(data) &&
      !this.isScAddress(receiver);
  }

  private isDataLengthValid = (data: string): boolean => data?.length >= this.minDataLength;

  private isScAddress = (address: string): boolean => new Address(address).isContractAddress();
}
