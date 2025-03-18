import { TransactionInPool } from '../../pool/entities/transaction.in.pool.dto';

/**
 * Represents a transaction with price per unit calculated
 */
export interface TransactionWithPpu extends TransactionInPool {
    ppu: number;
} 
