import { QueryPagination } from "src/common/entities/query.pagination"
import { TransactionStatus } from "./transaction.status"

export class TransactionFilter extends QueryPagination{
    sender: string | undefined
    receiver: string | undefined
    token: string | undefined
    senderShard: number | undefined
    receiverShard: number | undefined
    miniBlockHash: string | undefined
    hashes: string | undefined
    status: TransactionStatus | undefined
    search: string | undefined
    before: number | undefined
    after: number | undefined
}