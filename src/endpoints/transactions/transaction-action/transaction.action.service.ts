import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionMetadata } from "./entities/transaction.metadata";
import { TransactionAction } from "./entities/transaction.action";
import { TransactionActionMexRecognizerService } from "./recognizers/mex/transaction.action.mex.recognizer.service";
import { TransactionActionRecognizerInterface } from "./transaction.action.recognizer.interface";
import { StakeActionRecognizerService } from "./recognizers/staking/transaction.action.stake.recognizer.service";
import { SCCallActionRecognizerService } from "./recognizers/sc-calls/transaction.action.sc-calls.recognizer.service";
import { TransactionActionEsdtNftRecognizerService } from "./recognizers/esdt/transaction.action.esdt.nft.recognizer.service";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { MetabondingActionRecognizerService } from "./recognizers/mex/mex.metabonding.action.recognizer.service";
import { AddressUtils, BinaryUtils, OriginLogger, StringUtils } from "@multiversx/sdk-nestjs-common";
import { TokenTransferProperties } from "../../tokens/entities/token.transfer.properties";

@Injectable()
export class TransactionActionService {
  private recognizers: TransactionActionRecognizerInterface[] = [];
  private readonly logger = new OriginLogger(TransactionActionService.name);
  private crossChainTransferSenderShard = 4294967293;

  constructor(
    private readonly mexRecognizer: TransactionActionMexRecognizerService,
    private readonly esdtNftRecognizer: TransactionActionEsdtNftRecognizerService,
    private readonly stakeRecognizer: StakeActionRecognizerService,
    private readonly scCallRecognizer: SCCallActionRecognizerService,
    @Inject(forwardRef(() => TokenTransferService))
    private readonly tokenTransferService: TokenTransferService,
    private readonly metabondingRecognizer: MetabondingActionRecognizerService,
  ) { }

  private async getRecognizers() {
    if (this.recognizers.length === 0) {
      const isMexActive = await this.mexRecognizer.isActive();
      if (isMexActive) {
        this.recognizers.push(this.mexRecognizer);
      }

      this.recognizers.push(this.metabondingRecognizer);
      this.recognizers.push(this.esdtNftRecognizer);
      this.recognizers.push(this.stakeRecognizer);
      this.recognizers.push(this.scCallRecognizer);
    }

    return this.recognizers;
  }

  async getTransactionAction(transaction: Transaction, applyValue: boolean = false): Promise<TransactionAction | undefined> {
    if (transaction.txHash === '8537cde573855199b4bd2e01c4c6792c52f6cfaf2416e476b7ef32d4131c3f5a') {
      console.log('aqui');
    }
    const metadata = await this.getTransactionMetadata(transaction, applyValue);

    const recognizers = await this.getRecognizers();

    for (const recognizer of recognizers) {
      const action = await recognizer.recognize(metadata);
      if (action !== undefined) {
        return action;
      }
    }

    return undefined;
  }

  async getTransactionMetadata(transaction: Transaction, applyValue: boolean = false): Promise<TransactionMetadata> {
    const metadata = this.getNormalTransactionMetadata(transaction);

    const esdtMetadata = await this.getEsdtTransactionMetadata(metadata, applyValue);
    if (esdtMetadata) {
      return esdtMetadata;
    }

    const nftMetadata = await this.getNftTransferMetadata(metadata);
    if (nftMetadata) {
      return nftMetadata;
    }

    const multiMetadata = await this.getMultiTransferMetadata(metadata, applyValue);
    if (multiMetadata) {
      return multiMetadata;
    }

    return metadata;
  }

  private getNormalTransactionMetadata(transaction: Transaction): TransactionMetadata {
    const metadata = new TransactionMetadata();
    metadata.sender = transaction.sender;
    metadata.receiver = transaction.receiver;
    metadata.timestamp = transaction.timestamp;
    metadata.value = BigInt(transaction.value);
    if (transaction.senderShard !== undefined) {
      metadata.senderShard = transaction.senderShard;
    }

    if (transaction.data) {
      const decodedData = BinaryUtils.base64Decode(transaction.data);

      const dataComponents = decodedData.split('@');

      const args = dataComponents.slice(1);
      if (args.every(x => this.isSmartContractArgument(x))) {
        metadata.functionName = dataComponents[0];
        metadata.functionArgs = args;
      }

      if (metadata.functionName === 'relayedTx' && metadata.functionArgs.length === 1) {
        try {
          const relayedTransaction = JSON.parse(BinaryUtils.hexToString(metadata.functionArgs[0]));
          relayedTransaction.value = relayedTransaction.value.toString();
          relayedTransaction.sender = AddressUtils.bech32Encode(BinaryUtils.base64ToHex(relayedTransaction.sender));
          relayedTransaction.receiver = AddressUtils.bech32Encode(BinaryUtils.base64ToHex(relayedTransaction.receiver));
          return this.getNormalTransactionMetadata(relayedTransaction);
        } catch (error) {
          this.logger.error(`Unhandled error when interpreting relayed transaction with hash '${transaction.txHash}'`);
          this.logger.error(error);
        }
      }

      if (metadata.functionName === 'relayedTxV2' && metadata.functionArgs.length === 4) {
        try {
          const relayedTransaction = new Transaction();
          relayedTransaction.sender = transaction.receiver;
          relayedTransaction.receiver = AddressUtils.bech32Encode(metadata.functionArgs[0]);
          relayedTransaction.data = BinaryUtils.base64Encode(BinaryUtils.hexToString(metadata.functionArgs[2]));
          relayedTransaction.value = '0';

          return this.getNormalTransactionMetadata(relayedTransaction);
        } catch (error) {
          this.logger.error(`Unhandled error when interpreting relayed transaction v2 with hash '${transaction.txHash}'`);
          this.logger.error(error);
        }
      }
    }

    try {
      if (transaction.type === TransactionType.SmartContractResult) {
        if (metadata.functionName === 'MultiESDTNFTTransfer' &&
          metadata.functionArgs.length > 0
        ) {
          // if the first argument has up to 4 hex chars (meaning it will contain up to 65536 transfers)
          // then we insert the address as the first parameter. otherwise we assume that the address
          // is the first parameter, which will be correctly interpreted by the recognizers
          if (metadata.functionArgs[0].length <= 4) {
            metadata.functionArgs.splice(0, 0, AddressUtils.bech32Decode(metadata.receiver));
          }

          metadata.receiver = metadata.sender;
        }

        if (metadata.functionName === 'ESDTNFTTransfer' &&
          metadata.functionArgs.length > 3
        ) {
          metadata.functionArgs[3] = AddressUtils.bech32Decode(metadata.receiver);
          metadata.receiver = metadata.sender;
        }
      }
    } catch (error) {
      this.logger.error(`Unhandled error when interpreting MultiESDTNFTTransfer / ESDTNFTTransfer for smart contract result with hash '${transaction.txHash}'`);
      this.logger.error(error);
    }

    return metadata;
  }

  private isSmartContractArgument(arg: string): boolean {
    if (!StringUtils.isHex(arg)) {
      return false;
    }

    if (arg.length % 2 !== 0) {
      return false;
    }

    return true;
  }

  private async getMultiTransferMetadata(metadata: TransactionMetadata, applyValue: boolean = false): Promise<TransactionMetadata | undefined> {
    /*
    sovereign cross chain transfer example: MultiESDTNFTTransfer@02@4147452d626532353731@@01314fb37062980000@42474431362d633437663436@@5d894a4a3a220000
    regular chain example:                  MultiESDTNFTTransfer@0000000000000000050000b4c094947e427d79931a8bad81316b797d238cdb3f@02@4c524f4e452d633133303234@@036f5933a0d19ae387@524f4e452d626232653639@@04493d2ce61b650000@6164644c6971756964697479@01@01
     */
    const isSovereignCrossChainTransfer = metadata.senderShard === this.crossChainTransferSenderShard;
    if (metadata.sender !== metadata.receiver) {
      if (!isSovereignCrossChainTransfer) {
        return undefined;
      }
    }

    if (metadata.functionName !== 'MultiESDTNFTTransfer') {
      return undefined;
    }

    const args = metadata.functionArgs;
    if (args.length < 3) {
      return undefined;
    }

    if (!AddressUtils.isValidHexAddress(args[0]) && !isSovereignCrossChainTransfer) {
      return undefined;
    }

    let receiver: string;
    if (!isSovereignCrossChainTransfer) {
      receiver = AddressUtils.bech32Encode(args[0]);
    } else {
      receiver = metadata.receiver;
    }

    let transferCountIndex = 1;
    if (isSovereignCrossChainTransfer) {
      transferCountIndex = 0;
    }
    const transferCount = BinaryUtils.hexToNumber(args[transferCountIndex]);

    const result = new TransactionMetadata();
    if (!result.transfers) {
      result.transfers = [];
    }

    let index = 2;
    if (isSovereignCrossChainTransfer) {
      index = 1;
    }
    for (let i = 0; i < transferCount; i++) {
      const identifier = BinaryUtils.hexToString(args[index++]);
      const nonce = args[index++];
      const value = this.parseValueFromMultiTransferValueArg(args[index++]);

      let validProperties = false;
      if (nonce && nonce !== "00") {
        const properties = await this.tokenTransferService.getTokenTransferProperties({ identifier, nonce });
        if (properties) {
          validProperties = true;
          result.transfers.push({
            value,
            properties,
          });
        }
      } else {
        const properties = await this.tokenTransferService.getTokenTransferProperties({ identifier, timestamp: metadata.timestamp, value: value.toString(), applyValue });
        if (properties) {
          validProperties = true;
          result.transfers.push({
            value,
            properties,
          });
        }
      }

      // TODO: might remove this after token details are indexed inside sovereign es
      if (!validProperties) { // missing token details (decimals for example. extract transfer info - best effort)
        result.transfers.push({
          value,
          properties: new TokenTransferProperties({
            decimals: 18,
            identifier,
            ticker: identifier,
            token: identifier,
          }),
        });
      }
    }

    result.sender = metadata.sender;
    result.receiver = receiver;

    if (args.length > index) {
      result.functionName = BinaryUtils.hexToString(args[index++]);
      result.functionArgs = args.slice(index++);
    }

    return result;
  }

  private parseValueFromMultiTransferValueArg(rawData: string): BigInt {
    // if the data contains a lot of bytes, then it most likely doesn't express a BigInt value, but
    // a protobuf-marshalized string, out of which we only extract the value
    if (rawData.length > 64) {
      const valueLength = BinaryUtils.hexToNumber(rawData.slice(6, 8));

      const valueStartPosition = 8;
      const valueEndPosition = 8 + (valueLength * 2);

      return BinaryUtils.hexToBigInt(rawData.slice(valueStartPosition, valueEndPosition));
    }

    return BinaryUtils.hexToBigInt(rawData);
  }

  private async getNftTransferMetadata(metadata: TransactionMetadata): Promise<TransactionMetadata | undefined> {
    if (metadata.sender !== metadata.receiver) {
      return undefined;
    }

    if (metadata.functionName !== 'ESDTNFTTransfer') {
      return undefined;
    }

    const args = metadata.functionArgs;
    if (args.length < 4) {
      return undefined;
    }

    if (!AddressUtils.isValidHexAddress(args[3])) {
      return undefined;
    }

    const collectionIdentifier = BinaryUtils.hexToString(args[0]);
    const nonce = args[1];
    const value = BinaryUtils.hexToBigInt(args[2]);
    const receiver = AddressUtils.bech32Encode(args[3]);

    const properties = await this.tokenTransferService.getTokenTransferProperties({ identifier: collectionIdentifier, nonce });
    if (!properties) {
      return undefined;
    }

    const result = new TransactionMetadata();
    result.sender = metadata.sender;
    result.receiver = receiver;
    result.value = value;

    if (args.length > 4) {
      result.functionName = BinaryUtils.hexToString(args[4]);
      result.functionArgs = args.slice(5);
    }

    result.transfers = [{
      value,
      properties,
    }];

    return result;
  }

  private async getEsdtTransactionMetadata(metadata: TransactionMetadata, applyValue: boolean = false): Promise<TransactionMetadata | undefined> {
    if (metadata.functionName !== 'ESDTTransfer') {
      return undefined;
    }

    const args = metadata.functionArgs;
    if (args.length < 2) {
      return undefined;
    }

    const tokenIdentifier = BinaryUtils.hexToString(args[0]);
    const value = BinaryUtils.hexToBigInt(args[1]);

    const properties = await this.tokenTransferService.getTokenTransferProperties({ identifier: tokenIdentifier, timestamp: metadata.timestamp, value: value.toString(), applyValue });
    if (!properties) {
      return undefined;
    }

    const result = new TransactionMetadata();
    result.sender = metadata.sender;
    result.receiver = metadata.receiver;

    if (args.length > 2) {
      result.functionName = BinaryUtils.hexToString(args[2]);
      result.functionArgs = args.slice(3);
    }

    result.transfers = [{
      value,
      properties,
    }];

    result.value = metadata.value;

    return result;
  }
}
