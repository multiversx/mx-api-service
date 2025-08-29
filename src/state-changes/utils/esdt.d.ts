import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a MetaData. */
export interface IMetaData {
}

/** Represents a MetaData. */
export class MetaData implements IMetaData {

    /**
     * Constructs a new MetaData.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMetaData);

    /**
     * Creates a new MetaData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MetaData instance
     */
    public static create(properties?: IMetaData): MetaData;

    /**
     * Encodes the specified MetaData message. Does not implicitly {@link MetaData.verify|verify} messages.
     * @param message MetaData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMetaData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified MetaData message, length delimited. Does not implicitly {@link MetaData.verify|verify} messages.
     * @param message MetaData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IMetaData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a MetaData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MetaData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): MetaData;

    /**
     * Decodes a MetaData message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MetaData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): MetaData;

    /**
     * Verifies a MetaData message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a MetaData message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MetaData
     */
    public static fromObject(object: { [k: string]: any }): MetaData;

    /**
     * Creates a plain object from a MetaData message. Also converts values to other types if specified.
     * @param message MetaData
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: MetaData, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this MetaData to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for MetaData
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a ESDigitalToken. */
export interface IESDigitalToken {

    /** ESDigitalToken Type */
    Type?: (number|null);

    /** ESDigitalToken Value */
    Value?: (Uint8Array|null);

    /** ESDigitalToken Properties */
    Properties?: (Uint8Array|null);

    /** ESDigitalToken TokenMetaData */
    TokenMetaData?: (IMetaData|null);

    /** ESDigitalToken Reserved */
    Reserved?: (Uint8Array|null);
}

/** Represents a ESDigitalToken. */
export class ESDigitalToken implements IESDigitalToken {

    /**
     * Constructs a new ESDigitalToken.
     * @param [properties] Properties to set
     */
    constructor(properties?: IESDigitalToken);

    /** ESDigitalToken Type. */
    public Type: number;

    /** ESDigitalToken Value. */
    public Value: Uint8Array;

    /** ESDigitalToken Properties. */
    public Properties: Uint8Array;

    /** ESDigitalToken TokenMetaData. */
    public TokenMetaData?: (IMetaData|null);

    /** ESDigitalToken Reserved. */
    public Reserved: Uint8Array;

    /**
     * Creates a new ESDigitalToken instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ESDigitalToken instance
     */
    public static create(properties?: IESDigitalToken): ESDigitalToken;

    /**
     * Encodes the specified ESDigitalToken message. Does not implicitly {@link ESDigitalToken.verify|verify} messages.
     * @param message ESDigitalToken message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IESDigitalToken, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ESDigitalToken message, length delimited. Does not implicitly {@link ESDigitalToken.verify|verify} messages.
     * @param message ESDigitalToken message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IESDigitalToken, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ESDigitalToken message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ESDigitalToken
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ESDigitalToken;

    /**
     * Decodes a ESDigitalToken message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ESDigitalToken
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ESDigitalToken;

    /**
     * Verifies a ESDigitalToken message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ESDigitalToken message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ESDigitalToken
     */
    public static fromObject(object: { [k: string]: any }): ESDigitalToken;

    /**
     * Creates a plain object from a ESDigitalToken message. Also converts values to other types if specified.
     * @param message ESDigitalToken
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ESDigitalToken, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ESDigitalToken to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ESDigitalToken
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}
