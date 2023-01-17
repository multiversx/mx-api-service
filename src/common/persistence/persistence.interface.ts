import { CollectionTrait } from "src/endpoints/collections/entities/collection.trait";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";

export interface PersistenceInterface {
  getMedia(identifier: string): Promise<NftMedia[] | null>

  batchGetMedia(identifiers: string[]): Promise<{ [key: string]: NftMedia[] }>

  setMedia(identifier: string, value: NftMedia[]): Promise<void>

  getMetadata(identifier: string): Promise<any | null>

  deleteMetadata(identifier: string): Promise<void>

  batchGetMetadata(identifiers: string[]): Promise<{ [key: string]: any }>

  setMetadata(identifier: string, value: any): Promise<void>

  getCollectionTraits(collection: string): Promise<CollectionTrait[] | null>

  getKeybaseConfirmationForIdentity(identity: string): Promise<string[] | undefined>

  setKeybaseConfirmationForIdentity(identity: string, keys: string[]): Promise<void>

  getSetting<T>(name: string): Promise<T | undefined>

  setSetting<T>(name: string, value: T): Promise<void>

  getAllSettings(): Promise<{ name: string, value: any }[]>
}
