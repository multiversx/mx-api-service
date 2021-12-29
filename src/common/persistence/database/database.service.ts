import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/queue.worker/nft.worker/queue/job-services/media/entities/nft.media.db";
import { NftMetadataDb } from "src/queue.worker/nft.worker/queue/job-services/metadata/entities/nft.metadata.db";
import { Repository } from "typeorm";


@Injectable()
export class DatabaseService {

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

  async setMetadata(identifier: string, value: NftMetadataDb): Promise<void> {
    const found = await this.nftMetadataRepository.findOne({ id: identifier });
    if (!found) {
      await this.nftMetadataRepository.save(value);
    } else {
      await this.nftMetadataRepository.update({ id: identifier }, value)
    }
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    let media: NftMediaDb | undefined = await this.nftMediaRepository.findOne({ id: identifier });
    if (!media) {
      return null;
    }

    return media.content;
  }

  async setMedia(identifier: string, value: NftMediaDb): Promise<void> {
    const found = await this.nftMediaRepository.findOne({ id: identifier });
    if (!found) {
      await this.nftMediaRepository.save(value);
    } else {
      await this.nftMediaRepository.update({ id: identifier }, value)
    }
  }
}