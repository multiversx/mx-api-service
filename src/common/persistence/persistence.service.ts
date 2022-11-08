import { Inject, Injectable } from "@nestjs/common";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { PersistenceInterface } from "./persistence.interface";
import { LogPerformanceAsync } from "../../utils/decorators";

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    @Inject('PersistenceInterface')
    private readonly persistenceInterface: PersistenceInterface,
  ) { }


  @LogPerformanceAsync('setPersistenceDuration', 'getMedia')
  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    return await this.persistenceInterface.getMedia(identifier);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'batchGetMedia')
  async batchGetMedia(identifiers: string[]): Promise<{ [key: string]: NftMedia[]; }> {
    return await this.persistenceInterface.batchGetMedia(identifiers);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'setMedia')
  async setMedia(identifier: string, value: NftMedia[]): Promise<void> {
    await this.persistenceInterface.setMedia(identifier, value);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'getMetadata')
  async getMetadata(identifier: string): Promise<any> {
    return await this.persistenceInterface.getMetadata(identifier);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'deleteMetadata')
  async deleteMetadata(identifier: string): Promise<void> {
    await this.persistenceInterface.deleteMetadata(identifier);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'batchGetMetadata')
  async batchGetMetadata(identifiers: string[]): Promise<{ [key: string]: any; }> {
    return await this.persistenceInterface.batchGetMetadata(identifiers);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'setMetadata')
  async setMetadata(identifier: string, value: any): Promise<void> {
    await this.persistenceInterface.setMetadata(identifier, value);
  }

  @LogPerformanceAsync('setPersistenceDuration', 'getCollectionTraits')
  async getCollectionTraits(identifier: string): Promise<CollectionTrait[] | null> {
    return await this.getCollectionTraits.name, this.persistenceInterface.getCollectionTraits(identifier);
  }
}
