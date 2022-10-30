
export class HeartBeatsStatus {
  constructor(init?: Partial<HeartBeatsStatus>) {
    Object.assign(this, init);
  }

  timeStamp: string = '';
  publicKey: string = '';
  versionNumber: string = '';
  nodeDisplayName: string = '';
  identity: string = '';
  receivedShardID: number = 0;
  computedShardID: number = 0;
  peerType: string = '';
  isActive: boolean = false;
  nonce: number = 0;
  numInstances: number = 0;
  peerSubType: number = 0;
}
