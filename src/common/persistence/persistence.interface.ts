import { NftMedia } from "src/endpoints/nfts/entities/nft.media";

export interface PersistenceInterface {
  getMedia(identifier: string): Promise<NftMedia[] | null>

  setMedia(identifier: string, value: NftMedia[]): Promise<void>

  getMetadata(identifier: string): Promise<any | null>

  setMetadata(identifier: string, value: any): Promise<void>
}