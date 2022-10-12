import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";

export class NftMessage {
  identifier: string = '';
  settings: ProcessNftSettings = new ProcessNftSettings();
}
