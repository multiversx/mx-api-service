import { Injectable, Logger } from "@nestjs/common";
import { BinaryUtils } from "src/utils/binary.utils";
import { TransactionLog } from "./entities/transaction.log";
import { TransactionLogEvent } from "./entities/transaction.log.event";
import { TransactionLogEventIdentifier } from "./entities/transaction.log.event.identifier";
import { TransactionOperation } from "./entities/transaction.operation";
import { TransactionOperationAction } from "./entities/transaction.operation.action";
import { TransactionOperationType } from "./entities/transaction.operation.type";

@Injectable()
export class TokenTransferService {
  private readonly logger: Logger

  constructor(
  ) {
    this.logger = new Logger(TokenTransferService.name);
  }

  getTokenTransfer(elasticTransaction: any): { tokenIdentifier: string, tokenAmount: string } | undefined {
    if (!elasticTransaction.data) {
      return undefined;
    }

    let tokens = elasticTransaction.tokens;
    if (!tokens || tokens.length === 0) {
      return undefined;
    }

    let esdtValues = elasticTransaction.esdtValues;
    if (!esdtValues || esdtValues.length === 0) {
      return undefined;
    }

    let decodedData = BinaryUtils.base64Decode(elasticTransaction.data);
    if (!decodedData.startsWith('ESDTTransfer@')) {
      return undefined;
    }

    let token = tokens[0];
    let esdtValue = esdtValues[0];

    return { tokenIdentifier: token, tokenAmount: esdtValue };
  }

  getOperationsForTransactionLogs(txHash: string, logs: TransactionLog[]): TransactionOperation[] {
    let operations: (TransactionOperation | undefined)[] = [];

    for (let log of logs) {
      for (let event of log.events) {
        switch (event.identifier) {
          case TransactionLogEventIdentifier.ESDTNFTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTNFTBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTNFTAddQuantity:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.addQuantity));
            break;
          case TransactionLogEventIdentifier.ESDTNFTCreate:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.create));
            break;
          case TransactionLogEventIdentifier.MultiESDTNFTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.multiTransfer));
            break;
          case TransactionLogEventIdentifier.ESDTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTLocalMint:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localMint));
            break;
          case TransactionLogEventIdentifier.ESDTLocalBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localBurn));
            break;
          case TransactionLogEventIdentifier.ESDTWipe:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.wipe));
            break;
        }
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation!);
  }

  private getTransactionNftOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): TransactionOperation | undefined {
    try {
      let identifier = BinaryUtils.base64Decode(event.topics[0]);
      let nonce = BinaryUtils.tryBase64ToHex(event.topics[1]);
      let value = BinaryUtils.tryBase64ToBigInt(event.topics[2])?.toString() ?? '0';
      let receiver = BinaryUtils.tryBase64ToAddress(event.topics[3]) ?? log.address;

      let collection: string | undefined = undefined;
      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`
      }

      let type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

      return { action, type, collection, identifier, sender: event.address, receiver, value };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
      this.logger.error(error);
      return undefined;
    }
  }
}