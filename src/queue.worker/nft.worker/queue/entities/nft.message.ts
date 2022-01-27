import { Nft } from "src/endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";

export class NftMessage {
  identifier: string = '';
  nft: Nft = new Nft();
  settings: ProcessNftSettings = new ProcessNftSettings();
}