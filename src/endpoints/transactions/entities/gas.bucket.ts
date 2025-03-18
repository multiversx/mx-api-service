/**
 * Represents a gas bucket for PPU calculation
 */
export interface GasBucket {
    /**
     * Bucket index
     */
    index: number;

    /**
     * Total gas accumulated in this bucket
     */
    gasAccumulated: number;

    /**
     * PPU of the first transaction in the bucket
     */
    ppuBegin: number;

    /**
     * PPU of the last transaction in the bucket
     */
    ppuEnd?: number;

    /**
     * Number of transactions in the bucket
     */
    numTransactions: number;
} 
