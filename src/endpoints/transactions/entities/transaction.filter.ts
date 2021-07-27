import { QueryPagination } from "src/common/entities/query.pagination"
import { QueryCondition } from "src/helpers/entities/elastic/query.condition"
import { TransactionStatus } from "./transaction.status"

export class TransactionFilter extends QueryPagination{
    sender: string | undefined
    receiver: string | undefined
    senderShard: number | undefined
    receiverShard: number | undefined
    miniBlockHash: string | undefined
    status: TransactionStatus | undefined
    condition: QueryCondition | undefined
    before: number | undefined
    after: number | undefined
}