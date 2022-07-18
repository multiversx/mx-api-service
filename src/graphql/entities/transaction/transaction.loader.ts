// import { Injectable, Scope } from "@nestjs/common";

// import DataLoader = require("dataloader");

// import { TransactionService } from "src/endpoints/transactions/transaction.service";

// @Injectable({
//   scope: Scope.REQUEST,
// })
// export class TransactionLoader {
//   private readonly loader;

//   constructor(private readonly transactionService: TransactionService) {
//     this.loader = new DataLoader(async (identifiers) => {
//       return identifiers.map(async (key: string) => await this.transactionService.getTransaction(key));
//     });
//   }

//   public load(keys: string[]) {
//     return keys.map(async key => await this.transactionService.getTransaction(key));
//   }

// }
