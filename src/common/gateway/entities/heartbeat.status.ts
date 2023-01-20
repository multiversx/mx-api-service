export class HeartbeatStatus {
  constructor(init?: Partial<HeartbeatStatus>) {
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
  numTrieNodesReceived: number = 0;
}
