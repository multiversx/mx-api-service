import { OriginLogger } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TransactionDb } from "./entities/transaction.db.entity";

@Injectable()
export class TransactionDbService {
    private readonly logger = new OriginLogger(TransactionDbService.name);

    constructor(
        @InjectRepository(TransactionDb)
        private transactionDbRepository: Repository<TransactionDb>,
    ) { }

    async createTransaction(transaction: TransactionDb) {
        this.logger.log(`Creating new transaction: ${transaction.tx_hash}`);

        await this.transactionDbRepository.save({ tx_hash: transaction.tx_hash });
    }

    async findTransaction(txId: string): Promise<TransactionDb | null> {
        return await this.transactionDbRepository.findOneBy({ tx_hash: txId });
    }

    async findAllTransactions(): Promise<TransactionDb[]> {
        return await this.transactionDbRepository.find();
    }
}
