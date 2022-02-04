/* eslint-disable require-await */
import { Injectable } from "@nestjs/common";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { PersistenceInterface } from "../persistence.interface";

@Injectable()
export class PassThroughService implements PersistenceInterface {
  constructor() { }

  async getMetadata(_: string): Promise<any | null> {
    return null;
  }

  async batchGetMedia(_: string[]): Promise<{ [key: string]: NftMedia[] }> {
    return {};
  }

  async setMetadata(_: string, __: any): Promise<void> {

  }

  async getMedia(_: string): Promise<NftMedia[] | null> {
    return null;
  }

  async batchGetMetadata(_: string[]): Promise<{ [key: string]: any }> {
    return {};
  }

  async setMedia(_: string, __: NftMedia[]): Promise<void> {

  }
}
