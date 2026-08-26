import { Injectable } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';
import { TransactionType } from 'src/endpoints/transactions/entities/transaction.type';
import { TransferService } from 'src/endpoints/transfers/transfer.service';
import { EventsService } from 'src/endpoints/events/events.service';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';
import { Events } from 'src/endpoints/events/entities/events';

export class CustomSubscriptionsRoundData {
  constructor(init?: Partial<CustomSubscriptionsRoundData>) {
    Object.assign(this, init);
  }

  transactions: Transaction[] = [];
  transfers: Transaction[] = [];
  events: Events[] = [];
}

@Injectable()
export class CustomSubscriptionsDataFetcher {
  private readonly logger = new OriginLogger(CustomSubscriptionsDataFetcher.name);

  private static readonly batchSize = 10000;

  constructor(
    private readonly transferService: TransferService,
    private readonly eventsService: EventsService,
  ) { }

  // Fetches everything the custom subscription gateways need for a given round, once.
  // The 'operations' index holds both transactions and smart contract results, so the
  // transactions payload is derived from the transfers payload instead of being queried again.
  async fetchRoundData(timestampMs: number): Promise<CustomSubscriptionsRoundData> {
    const [transfers, events] = await Promise.all([
      this.fetchTransfers(timestampMs),
      this.fetchEvents(timestampMs),
    ]);

    return new CustomSubscriptionsRoundData({
      transfers,
      transactions: this.extractTransactions(transfers),
      events,
    });
  }

  private async fetchTransfers(timestampMs: number): Promise<Transaction[]> {
    try {
      const size = CustomSubscriptionsDataFetcher.batchSize;
      const filter = new TransactionFilter({ before: timestampMs, after: timestampMs, withTxsRelayedByAddress: true });
      const options = new TransactionQueryOptions({ withScamInfo: false, withUsername: true, withBlockInfo: false, withLogs: false, withOperations: false, withActionTransferValue: false, withTxsOrder: false });

      const allTransfers: Transaction[] = [];

      let batch = await this.transferService.getTransfers(filter, new QueryPagination({ size }), options);
      allTransfers.push(...batch);

      while (batch.length === size) {
        const searchAfter = batch[batch.length - 1].searchAfter;
        if (searchAfter == null) {
          break;
        }

        batch = await this.transferService.getTransfers(filter, new QueryPagination({ size, searchAfter }), options);

        allTransfers.push(...batch);
      }

      return allTransfers;
    } catch (error) {
      this.logger.error(`Error fetching transfers for timestamp '${timestampMs}'`);
      this.logger.error(error);
      return [];
    }
  }

  private async fetchEvents(timestampMs: number): Promise<Events[]> {
    try {
      const size = CustomSubscriptionsDataFetcher.batchSize;
      const filter = new EventsFilter({ before: timestampMs, after: timestampMs });

      const allEvents: Events[] = [];

      let batch = await this.eventsService.getEvents(new QueryPagination({ size }), filter);
      allEvents.push(...batch);

      while (batch.length === size) {
        const searchAfter = batch[batch.length - 1].searchAfter;
        if (searchAfter == null) {
          break;
        }

        batch = await this.eventsService.getEvents(new QueryPagination({ size, searchAfter }), filter);

        allEvents.push(...batch);
      }

      return allEvents;
    } catch (error) {
      this.logger.error(`Error fetching events for timestamp '${timestampMs}'`);
      this.logger.error(error);
      return [];
    }
  }

  // Transactions are the 'normal' subset of the operations returned for transfers. They are
  // cloned so that clearing the type does not alter the objects broadcast on the transfers channel.
  private extractTransactions(transfers: Transaction[]): Transaction[] {
    const transactions: Transaction[] = [];

    for (const transfer of transfers) {
      if (transfer.type !== TransactionType.Transaction) {
        continue;
      }

      const transaction = Object.assign(new TransactionDetailed(), transfer);
      transaction.type = undefined;

      transactions.push(transaction);
    }

    return transactions;
  }
}
