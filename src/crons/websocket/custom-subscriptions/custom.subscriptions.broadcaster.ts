import { Injectable } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { Operation } from 'src/common/indexer/entities';
import { Events as IndexerEvents } from 'src/common/indexer/entities/events';
import { EventsService } from 'src/endpoints/events/events.service';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';
import { TransactionType } from 'src/endpoints/transactions/entities/transaction.type';
import { TransactionService } from 'src/endpoints/transactions/transaction.service';
import { TransferService } from 'src/endpoints/transfers/transfer.service';
import { RetryUtils } from 'src/utils/retry.utils';
import { ConnectionHandler } from '../connection.handler';
import { EventsCustomGateway } from '../events.custom.gateway';
import { TransactionsCustomGateway } from '../transaction.custom.gateway';
import { TransfersCustomGateway } from '../transfers.custom.gateway';
import { IndexerRound } from './indexer.round';
import { RawTransfer } from './raw.transfer';

@Injectable()
export class CustomSubscriptionsBroadcaster {
  private readonly logger = new OriginLogger(CustomSubscriptionsBroadcaster.name);

  private static readonly mapOptions = new TransactionQueryOptions({ withCanBeIgnoredFlag: true });
  private static readonly enrichOptions = new TransactionQueryOptions({ withScamInfo: false, withUsername: true, withActionTransferValue: false });
  private static readonly maxRetries = 3;
  private static readonly retryDelayMs = 500;

  constructor(
    private readonly transferService: TransferService,
    private readonly transactionService: TransactionService,
    private readonly eventsService: EventsService,
    private readonly connectionHandler: ConnectionHandler,
    private readonly transfersCustomGateway: TransfersCustomGateway,
    private readonly transactionsCustomGateway: TransactionsCustomGateway,
    private readonly eventsCustomGateway: EventsCustomGateway,
  ) { }

  hasSubscriptions(): boolean {
    return this.connectionHandler.hasSubscriptionsWithPrefixes([
      TransactionsCustomGateway.keyPrefix,
      TransfersCustomGateway.keyPrefix,
      EventsCustomGateway.keyPrefix,
    ]);
  }

  async broadcast(round: IndexerRound): Promise<void> {
    this.broadcastEvents(round.timestampMs, round.events);
    await this.broadcastTransfers(round.timestampMs, round.operations);
  }

  private broadcastEvents(timestampMs: number, elasticEvents: IndexerEvents[]): void {
    try {
      const events = elasticEvents.map(elasticEvent => this.eventsService.mapEvent(elasticEvent));
      const eventsByRoom = this.eventsCustomGateway.matchRooms(events);

      this.eventsCustomGateway.broadcast(timestampMs, eventsByRoom);
    } catch (error) {
      this.logger.error(`Could not broadcast custom events for timestamp '${timestampMs}'`);
      this.logger.error(error);
    }
  }

  private async broadcastTransfers(timestampMs: number, elasticOperations: Operation[]): Promise<void> {
    const matches = await this.matchAndEnrichTransfers(timestampMs, elasticOperations);
    if (!matches) {
      return;
    }

    try {
      this.transfersCustomGateway.broadcast(timestampMs, matches.transfersByRoom);
    } catch (error) {
      this.logger.error(`Could not broadcast custom transfers for timestamp '${timestampMs}'`);
      this.logger.error(error);
    }

    try {
      this.transactionsCustomGateway.broadcast(timestampMs, this.toTransactions(matches.transactionsByRoom));
    } catch (error) {
      this.logger.error(`Could not broadcast custom transactions for timestamp '${timestampMs}'`);
      this.logger.error(error);
    }
  }

  private async matchAndEnrichTransfers(timestampMs: number, elasticOperations: Operation[]): Promise<{ transfersByRoom: Map<string, TransactionDetailed[]>; transactionsByRoom: Map<string, TransactionDetailed[]> } | undefined> {
    const maxRetries = CustomSubscriptionsBroadcaster.maxRetries;

    try {
      const rawTransfers = this.toRawTransfers(elasticOperations);
      const transactions = rawTransfers
        .map(rawTransfer => rawTransfer.transfer)
        .filter(transfer => transfer.type === TransactionType.Transaction);

      const transfersByRoom = this.transfersCustomGateway.matchRooms(rawTransfers);
      const transactionsByRoom = this.transactionsCustomGateway.matchRooms(transactions);

      const matchedTransfers = [...new Set([...transfersByRoom.values(), ...transactionsByRoom.values()].flat())];
      if (matchedTransfers.length === 0) {
        return undefined;
      }

      await RetryUtils.retry(
        () => this.transferService.processTransfers(matchedTransfers, CustomSubscriptionsBroadcaster.enrichOptions),
        maxRetries,
        CustomSubscriptionsBroadcaster.retryDelayMs,
        retry => this.logger.warn(`Could not enrich custom transfers for timestamp '${timestampMs}', retrying (${retry}/${maxRetries})`),
      );

      return { transfersByRoom, transactionsByRoom };
    } catch (error) {
      this.logger.error(`Could not prepare custom transfers and transactions for timestamp '${timestampMs}', skipping them`);
      this.logger.error(error);
      return undefined;
    }
  }

  private toRawTransfers(elasticOperations: Operation[]): RawTransfer[] {
    const sortedOperations: Operation[] = this.transferService.sortElasticTransfers(elasticOperations);
    const transfers = this.transferService.mapElasticTransfers(sortedOperations, CustomSubscriptionsBroadcaster.mapOptions);
    this.transactionService.processRelayedInfo(transfers);

    const rawTransfers: RawTransfer[] = [];
    for (const [index, transfer] of transfers.entries()) {
      if (transfer.canBeIgnored === true) {
        continue;
      }

      rawTransfers.push(new RawTransfer({ transfer, tokens: sortedOperations[index].tokens ?? [] }));
    }

    return rawTransfers;
  }

  private toTransactions(transfersByRoom: Map<string, TransactionDetailed[]>): Map<string, TransactionDetailed[]> {
    const transactionsByTransfer = new Map<TransactionDetailed, TransactionDetailed>();
    const transactionsByRoom = new Map<string, TransactionDetailed[]>();

    for (const [roomName, transfers] of transfersByRoom) {
      const transactions: TransactionDetailed[] = [];

      for (const transfer of transfers) {
        let transaction = transactionsByTransfer.get(transfer);
        if (!transaction) {
          transaction = Object.assign(new TransactionDetailed(), transfer);
          transaction.type = undefined;
          transactionsByTransfer.set(transfer, transaction);
        }

        transactions.push(transaction);
      }

      transactionsByRoom.set(roomName, transactions);
    }

    return transactionsByRoom;
  }
}
