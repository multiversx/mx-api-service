import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/queue.worker/nft.worker/queue/job-services/media/entities/nft.media.db";
import { NftMetadataDb } from "src/queue.worker/nft.worker/queue/job-services/metadata/entities/nft.metadata.db";
import { Repository } from "typeorm";
import { PersistenceInterface } from "../persistence.interface";

@Injectable()
export class DatabaseService implements PersistenceInterface {
  constructor(
    @InjectRepository(NftMetadataDb)
    private readonly nftMetadataRepository: Repository<NftMetadataDb>,
    @InjectRepository(NftMediaDb)
    private readonly nftMediaRepository: Repository<NftMediaDb>,
  ) { }

  async getMetadata(identifier: string): Promise<any | null> {
    let metadataDb: NftMetadataDb | undefined = await this.nftMetadataRepository.findOne({ id: identifier });
    if (!metadataDb) {
      return null;
    }

    return metadataDb.content;
  }

  async setMetadata(identifier: string, content: any): Promise<void> {
    let metadata = new NftMetadataDb();
    metadata.id = identifier;
    metadata.content = content;

    const found = await this.nftMetadataRepository.findOne({ id: identifier });
    if (!found) {
      await this.nftMetadataRepository.save(metadata);
    } else {
      await this.nftMetadataRepository.update({ id: identifier }, metadata)
    }
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    let media: NftMediaDb | undefined = await this.nftMediaRepository.findOne({ id: identifier });
    if (!media) {
      return null;
    }

    return media.content;
  }

  async setMedia(identifier: string, media: NftMedia[]): Promise<void> {
    let value = new NftMediaDb();
    value.id = identifier;
    value.content = media;

    const found = await this.nftMediaRepository.findOne({ id: identifier });
    if (!found) {
      await this.nftMediaRepository.save(value);
    } else {
      await this.nftMediaRepository.update({ id: identifier }, value)
    }
  }
}