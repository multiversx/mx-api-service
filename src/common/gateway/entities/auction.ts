import { AuctionNode } from "./auction.node";

export class Auction {
  constructor(init?: Partial<Auction>) {
    Object.assign(this, init);
  }

  owner: string = '';

  numStakedNodes: number = 0;

  totalTopUp: string = '0';

  topUpPerNode: string = '0';

  qualifiedTopUp: string = '0';

  auctionList: AuctionNode[] = [];
}
