/**
 * Constants used for gas bucket distribution and PPU calculation
 */
export const GasBucketConstants = {
    /**
     * Size of each gas bucket in units
     */
    GAS_BUCKET_SIZE: 6000000000,

    /**
     * Index of the "Fast" bucket in the sorted buckets array
     */
    FAST_BUCKET_INDEX: 2,

    /**
     * Index of the "Faster" bucket in the sorted buckets array
     */
    FASTER_BUCKET_INDEX: 0,
}; 