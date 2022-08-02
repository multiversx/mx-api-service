import { Collection } from "./collection";

export interface Token extends Collection {
  identifier: string;
  balance: string;
  roles: any;
}
