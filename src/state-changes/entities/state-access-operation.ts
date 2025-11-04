export enum StateAccessOperation {
  NotSet = 0,
  GetCode = 1 << 0,
  SaveAccount = 1 << 1,
  GetAccount = 1 << 2,
  WriteCode = 1 << 3,
  RemoveDataTrie = 1 << 4,
  GetDataTrieValue = 1 << 5,
}
