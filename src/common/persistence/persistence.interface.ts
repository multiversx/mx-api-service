import { NftMedia } from "src/endpoints/nfts/entities/nft.media";

export interface PersistenceInterface {
  getMedia(identifier: string): Promise<NftMedia[] | null>

  batchGetMedia(identifiers: string[]): Promise<{ [key: string]: NftMedia[] }>

  setMedia(identifier: string, value: NftMedia[]): Promise<void>

  getMetadata(identifier: string): Promise<any | null>

  deleteMetadata(identifier: string): Promise<void>

  batchGetMetadata(identifiers: string[]): Promise<{ [key: string]: any }>

  setMetadata(identifier: string, value: any): Promise<void>

  getTransaction(txHash: string): Promise<any | undefined>

  setTransaction(txHash: string, body: any): Promise<void>
}
