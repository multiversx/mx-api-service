import { QueryPagination } from "src/common/entities/query.pagination"
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options"
import { TransactionStatus } from "./transaction.status"

export class TransactionFilter extends QueryPagination{
    sender: string | undefined
    receiver: string | undefined
    senderShard: number | undefined
    receiverShard: number | undefined
    miniBlockHash: string | undefined
    status: TransactionStatus | undefined
    search: string | undefined
    condition: QueryConditionOptions | undefined = QueryConditionOptions.must
    before: number | undefined
    after: number | undefined
}