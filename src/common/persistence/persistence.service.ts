import { PerformanceProfiler } from "@multiversx/sdk-nestjs";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { PersistenceInterface } from "./persistence.interface";

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    @Inject('PersistenceInterface')
    private readonly persistenceInterface: PersistenceInterface,
    @Inject(forwardRef(() => ApiMetricsService))
    private readonly metricsService: ApiMetricsService,
  ) { }

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      return await action;
    } finally {
      profiler.stop();

      this.metricsService.setPersistenceDuration(key, profiler.duration);
    }
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    return await this.execute('getMedia', this.persistenceInterface.getMedia(identifier));
  }

  async batchGetMedia(identifiers: string[]): Promise<{ [key: string]: NftMedia[]; }> {
    return await this.execute('batchGetMedia', this.persistenceInterface.batchGetMedia(identifiers));
  }

  async setMedia(identifier: string, value: NftMedia[]): Promise<void> {
    await this.execute('setMedia', this.persistenceInterface.setMedia(identifier, value));
  }

  async getMetadata(identifier: string): Promise<any> {
    return await this.execute('getMetadata', this.persistenceInterface.getMetadata(identifier));
  }

  async deleteMetadata(identifier: string): Promise<void> {
    await this.execute('deleteMetadata', this.persistenceInterface.deleteMetadata(identifier));
  }

  async batchGetMetadata(identifiers: string[]): Promise<{ [key: string]: any; }> {
    return await this.execute('batchGetMetadata', this.persistenceInterface.batchGetMetadata(identifiers));
  }

  async setMetadata(identifier: string, value: any): Promise<void> {
    await this.execute('setMetadata', this.persistenceInterface.setMetadata(identifier, value));
  }

  async getKeybaseConfirmationForIdentity(identity: string): Promise<string[] | undefined> {
    return await this.execute('getKeybaseConfirmationForIdentity', this.persistenceInterface.getKeybaseConfirmationForIdentity(identity));
  }

  async setKeybaseConfirmationForIdentity(identity: string, keys: string[]): Promise<void> {
    await this.execute('setKeybaseConfirmationForIdentity', this.persistenceInterface.setKeybaseConfirmationForIdentity(identity, keys));
  }

  async getCollectionTraits(identifier: string): Promise<CollectionTrait[] | null> {
    return await this.execute(this.getCollectionTraits.name, this.persistenceInterface.getCollectionTraits(identifier));
  }

  async getSetting<T>(name: string): Promise<T | undefined> {
    return await this.execute(this.getSetting.name, this.persistenceInterface.getSetting(name));
  }

  async setSetting<T>(name: string, value: T): Promise<void> {
    return await this.execute(this.setSetting.name, this.persistenceInterface.setSetting(name, value));
  }

  async getAllSettings(): Promise<{ name: string, value: any }[]> {
    return await this.execute(this.getAllSettings.name, this.persistenceInterface.getAllSettings());
  }
}
