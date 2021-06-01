export class TransactionQuery {
    sender: string | undefined
    receiver: string | undefined
    senderShard: number | undefined
    receiverShard: number | undefined
    miniBlockHash: string | undefined
    condition: string | undefined
    before: number | undefined
    after: number | undefined
    from: number = 0
    size: number = 25
}