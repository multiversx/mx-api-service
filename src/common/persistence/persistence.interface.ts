import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMediaDb } from "src/queue.worker/nft.worker/queue/job-services/media/entities/nft.media.db";
import { NftMetadataDb } from "src/queue.worker/nft.worker/queue/job-services/metadata/entities/nft.metadata.db";

export interface PersistenceInterface {
  getMedia(identifier: string): Promise<NftMedia[] | null>

  setMedia(identifier: string, value: NftMediaDb): Promise<void>

  getMetadata(identifier: string): Promise<any | null>

  setMetadata(identifier: string, value: NftMetadataDb): Promise<void>
}