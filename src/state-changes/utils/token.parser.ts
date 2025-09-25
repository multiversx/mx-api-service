export class TokenParser {
    // Constants from Go
    private static readonly esdtTickerNumRandChars: number = 6;
    private static readonly separatorChar: string = "-";
    private static readonly minLengthForTickerName: number = 3;
    private static readonly maxLengthForTickerName: number = 10;

    /**
     * ExtractTokenIDAndNonceFromTokenStorageKey
     * Parses the token's storage key and extracts the identifier and the nonce.
     *
     * Examples:
     *   "ALC-1q2w3e"   -> ["ALC-1q2w3e", "0"] (fungible, no nonce)
     *   "ALC-2w3e4rX" -> ["ALC-2w3e4r", "X"] (non-fungible, nonce = "X")
     */
    public static extractTokenIDAndNonceHexFromTokenStorageKey(
        tokenKeyRaw: Buffer
    ): [string, string] {
        const tokenKey = tokenKeyRaw.toString();
        const token = tokenKey;

        const indexOfFirstHyphen = token.indexOf(this.separatorChar);
        if (indexOfFirstHyphen < 0) {
            return [tokenKey, "00"];
        }

        const tokenTicker = token.slice(0, indexOfFirstHyphen);
        const randomSequencePlusNonce = token.slice(indexOfFirstHyphen + 1);

        const tokenTickerLen = tokenTicker.length;

        const areTickerAndRandomSequenceInvalid =
            tokenTickerLen === 0 ||
            tokenTickerLen < this.minLengthForTickerName ||
            tokenTickerLen > this.maxLengthForTickerName ||
            randomSequencePlusNonce.length === 0;

        if (areTickerAndRandomSequenceInvalid) {
            return [tokenKey, "00"];
        }

        if (randomSequencePlusNonce.length < this.esdtTickerNumRandChars + 1) {
            return [tokenKey, "00"];
        }

        // ALC-1q2w3eX -> X is the nonce
        const nonceStr = randomSequencePlusNonce.slice(this.esdtTickerNumRandChars);

        const numCharsSinceNonce = token.length - nonceStr.length;
        const tokenID = token.slice(0, numCharsSinceNonce);
        if (nonceStr) {
            return [tokenID, Array.from(tokenKeyRaw.slice(tokenID.length)).map(byte => byte.toString(16).padStart(2, '0')).join('')];
        }
        return [tokenID, "00"];
    }
}
