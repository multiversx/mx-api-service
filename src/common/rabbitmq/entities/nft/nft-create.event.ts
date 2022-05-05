import { NftTopics } from './nft.topics';

export class NftCreateEvent {
  address: string = '';
  topics: string[] = [];
  decodedTopics: NftTopics;

  constructor(init?: Partial<NftCreateEvent>) {
    Object.assign(this, init);
    this.decodedTopics = NftTopics.parse(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
