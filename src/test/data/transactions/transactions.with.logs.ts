import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionLogEvent } from "src/endpoints/transactions/entities/transaction.log.event";

const transactionsWithLogs: TransactionLog[] =
  [{
    id: "f09434ed2c399fd2d0ca76b2674ff88f8e55626c8052a3b6beca92235736e8fb",
    address: "erd1qqqqqqqqqqqqqpgqg8a36rqxu4ch5v2522jv5avlun94sdv80n4sygxs94",
    addressAssets: {
      description: "",
      icon: "",
      iconPng: "",
      iconSvg: "",
      proof: "",
      name: "Maiar Exchange: WEGLD/USDC Liquidity Pool",
      tags: [
        "mex",
        "liquiditypool",
      ],
    },
    events: [] as TransactionLogEvent[],
    addressHerotag: "",
  },
  ];

export default transactionsWithLogs;
