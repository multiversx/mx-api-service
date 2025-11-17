import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a TrieLeafData. */
export interface ITrieLeafData {

  /** TrieLeafData value */
  value?: (Uint8Array | null);

  /** TrieLeafData key */
  key?: (Uint8Array | null);

  /** TrieLeafData address */
  address?: (Uint8Array | null);
}

/** Represents a TrieLeafData. */
export class TrieLeafData implements ITrieLeafData {

  /**
   * Constructs a new TrieLeafData.
   * @param [properties] Properties to set
   */
  constructor(properties?: ITrieLeafData);

  /** TrieLeafData value. */
  public value: Uint8Array;

  /** TrieLeafData key. */
  public key: Uint8Array;

  /** TrieLeafData address. */
  public address: Uint8Array;

  /**
   * Creates a new TrieLeafData instance using the specified properties.
   * @param [properties] Properties to set
   * @returns TrieLeafData instance
   */
  public static create(properties?: ITrieLeafData): TrieLeafData;

  /**
   * Encodes the specified TrieLeafData message. Does not implicitly {@link TrieLeafData.verify|verify} messages.
   * @param message TrieLeafData message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: ITrieLeafData, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified TrieLeafData message, length delimited. Does not implicitly {@link TrieLeafData.verify|verify} messages.
   * @param message TrieLeafData message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: ITrieLeafData, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a TrieLeafData message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns TrieLeafData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): TrieLeafData;

  /**
   * Decodes a TrieLeafData message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns TrieLeafData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): TrieLeafData;

  /**
   * Verifies a TrieLeafData message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): (string | null);

  /**
   * Creates a TrieLeafData message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns TrieLeafData
   */
  public static fromObject(object: { [k: string]: any }): TrieLeafData;

  /**
   * Creates a plain object from a TrieLeafData message. Also converts values to other types if specified.
   * @param message TrieLeafData
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: TrieLeafData, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this TrieLeafData to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for TrieLeafData
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}
