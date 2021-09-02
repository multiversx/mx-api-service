import { Address } from '@elrondnetwork/erdjs/out';
import { Injectable } from '@nestjs/common';
import { SmartContractResult } from '../entities/smart.contract.result';
import { TransactionDetailed } from '../entities/transaction.detailed';

@Injectable()
export class PotentialScamTransactionChecker {
  readonly minDataLength: number = 10;
  readonly maxDataLength: number = 1000;

  check(transaction: TransactionDetailed): boolean {
    const { sender, receiver, data, results } = transaction;
    return this.isDataLengthValid(data) &&
      !this.hasScResults(results) &&
      !this.isScAddress(sender) &&
      !this.isScAddress(receiver);
  }

  private hasScResults = (results: SmartContractResult[]): boolean => results?.length > 0;

  private isDataLengthValid = (data: string): boolean => data?.length >= 10 && data?.length <= 1000;

  private isScAddress = (address: string): boolean => new Address(address).isContractAddress();
}
