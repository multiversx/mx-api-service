import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
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

    await this.nftMetadataRepository.save(metadata);
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

    await this.nftMediaRepository.save(value);
  }
}