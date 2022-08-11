import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
import { Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";
import { TransactionDb } from "./entities/transaction.db";

@Injectable()
export class DatabaseService implements PersistenceInterface {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
    @InjectRepository(TransactionDb)
    private readonly transactionsRepository: Repository<TransactionDb>,
  ) {
    this.logger = new Logger(DatabaseService.name);
  }

  async getMetadata(identifier: string): Promise<any | null> {
    try {
      const metadataDb: NftMetadataDb | null = await this.nftMetadataRepository.findOne({ where: { id: identifier } });
      if (!metadataDb) {
        return null;
      }

      return metadataDb.content;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching metadata from DB for identifier '${identifier}'`);
      this.logger.error(error);
      return {};
    }
  }

  async batchGetMetadata(identifiers: string[]): Promise<Record<string, any>> {
    try {
      const metadatasDb = await this.nftMetadataRepository.findByIds(identifiers);

      return metadatasDb.toRecord(metadata => metadata.id, metadata => metadata.content);
    } catch (error) {
      this.logger.log(`Error when getting metadata from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMetadata(identifier: string, content: any): Promise<void> {
    const metadata = new NftMetadataDb();
    metadata.id = identifier;
    metadata.content = content;

    await this.nftMetadataRepository.save(metadata);
  }

  async deleteMetadata(identifier: string): Promise<void> {
    try {
      await this.nftMetadataRepository.delete(identifier);
    } catch (error) {
      this.logger.error(`An unexpected error occurred when trying to delete metadata from DB for identifier '${identifier}'`);
      this.logger.error(error);
    }
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    try {
      const media: NftMediaDb | null = await this.nftMediaRepository.findOne({ where: { id: identifier } });
      if (!media) {
        return null;
      }

      return media.content;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching media from DB for identifier '${identifier}'`);
      this.logger.error(error);
      return [];
    }
  }

  async batchGetMedia(identifiers: string[]): Promise<Record<string, NftMedia[]>> {
    try {
      const mediasDb = await this.nftMediaRepository.findByIds(identifiers);

      return mediasDb.toRecord(media => media.id ?? '', media => media.content);
    } catch (error) {
      this.logger.log(`Error when getting media from DB for batch '${identifiers}'`);
      this.logger.error(error);

      return {};
    }
  }

  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    const value = new NftMediaDb();
    value.id = identifier;
    value.content = media;

    await this.nftMediaRepository.save(value);
  }

  async getTransaction(txHash: string): Promise<any | null> {
    try {
      const transaction = await this.transactionsRepository.findOne({ where: { txHash } });
      if (!transaction) {
        return null;
      }

      return transaction.body;
    } catch (error) {
      this.logger.error(`An unexpected error occurred when fetching transaction from DB for txHash '${txHash}'`);
      this.logger.error(error);
      return null;
    }
  }

  async setTransaction(txHash: string, body: any): Promise<void> {
    const transaction = new TransactionDb();
    transaction.txHash = txHash;
    transaction.body = body;

    await this.transactionsRepository.save(transaction);
  }
}
