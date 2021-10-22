export class Account {
  address: string;
  nonce: string;
  balance: string;
  username: string;
  code: string;
  codeHash: string;
  rootHash: string;
  codeMetadata: string;
  developerReward: string;
  ownerAddress: string;

  constructor(json: any) {
    this.address = json.address;
    this.nonce = json.nonce;
    this.balance = json.balance;
    this.username = json.username;
    this.code = json.code;
    this.codeHash = json.codeHash;
    this.rootHash = json.rootHash;
    this.codeMetadata = json.codeMetadata;
    this.developerReward = json.developerReward;
    this.ownerAddress = json.ownerAddress;
  }
}
