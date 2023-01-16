// DATA COMING FROM NOTIFIER_GO

export interface Event {
  address: string;
  identifier: string;
  topics: Array<string>;
  data: string;
  txHash: string;
}

export interface Notification {
  hash: string;
  events: Array<Event>;
}

// DATA COMING FROM CLIENT
export interface SubscriptionEntry {
  address: string;
  identifier: string;
}
