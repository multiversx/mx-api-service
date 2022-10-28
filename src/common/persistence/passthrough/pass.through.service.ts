/* eslint-disable require-await */
import { Injectable } from "@nestjs/common";
import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { PersistenceInterface } from "../persistence.interface";

@Injectable()
export class PassThroughService implements PersistenceInterface {
  constructor() { }

  async getMetadata(_: string): Promise<any | null> {
    return null;
  }

  async batchGetMedia(_: string[]): Promise<{ [key: string]: NftMedia[]; }> {
    return {};
  }

  async setMetadata(_: string, __: any): Promise<void> {

  }

  async deleteMetadata(_: string): Promise<void> {

  }

  async getMedia(_: string): Promise<NftMedia[] | null> {
    return null;
  }

  async batchGetMetadata(_: string[]): Promise<{ [key: string]: any; }> {
    return {};
  }

  async setMedia(_: string, __: NftMedia[]): Promise<void> {

  }

  async getCollectionTraits(_collection: string): Promise<CollectionTrait[] | null> {
    return null;
  }

  async getSettingValue(_: string): Promise<unknown> {
    return null;
  }

  async setSettingValue(_: string, _value: boolean): Promise<void | null> {

  }

  async deleteSettingKey(_: string): Promise<void | null> {

  }
}
