import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a UserAccountData. */
export interface IUserAccountData {

  /** UserAccountData Nonce */
  Nonce?: (number | Long | null);

  /** UserAccountData Balance */
  Balance?: (Uint8Array | null);

  /** UserAccountData CodeHash */
  CodeHash?: (Uint8Array | null);

  /** UserAccountData RootHash */
  RootHash?: (Uint8Array | null);

  /** UserAccountData Address */
  Address?: (Uint8Array | null);

  /** UserAccountData DeveloperReward */
  DeveloperReward?: (Uint8Array | null);

  /** UserAccountData OwnerAddress */
  OwnerAddress?: (Uint8Array | null);

  /** UserAccountData UserName */
  UserName?: (Uint8Array | null);

  /** UserAccountData CodeMetadata */
  CodeMetadata?: (Uint8Array | null);
}

/** Represents a UserAccountData. */
export class UserAccountData implements IUserAccountData {

  /**
   * Constructs a new UserAccountData.
   * @param [properties] Properties to set
   */
  constructor(properties?: IUserAccountData);

  /** UserAccountData Nonce. */
  public Nonce: (number | Long);

  /** UserAccountData Balance. */
  public Balance: Uint8Array;

  /** UserAccountData CodeHash. */
  public CodeHash: Uint8Array;

  /** UserAccountData RootHash. */
  public RootHash: Uint8Array;

  /** UserAccountData Address. */
  public Address: Uint8Array;

  /** UserAccountData DeveloperReward. */
  public DeveloperReward: Uint8Array;

  /** UserAccountData OwnerAddress. */
  public OwnerAddress: Uint8Array;

  /** UserAccountData UserName. */
  public UserName: Uint8Array;

  /** UserAccountData CodeMetadata. */
  public CodeMetadata: Uint8Array;

  /**
   * Creates a new UserAccountData instance using the specified properties.
   * @param [properties] Properties to set
   * @returns UserAccountData instance
   */
  public static create(properties?: IUserAccountData): UserAccountData;

  /**
   * Encodes the specified UserAccountData message. Does not implicitly {@link UserAccountData.verify|verify} messages.
   * @param message UserAccountData message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encode(message: IUserAccountData, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Encodes the specified UserAccountData message, length delimited. Does not implicitly {@link UserAccountData.verify|verify} messages.
   * @param message UserAccountData message or plain object to encode
   * @param [writer] Writer to encode to
   * @returns Writer
   */
  public static encodeDelimited(message: IUserAccountData, writer?: $protobuf.Writer): $protobuf.Writer;

  /**
   * Decodes a UserAccountData message from the specified reader or buffer.
   * @param reader Reader or buffer to decode from
   * @param [length] Message length if known beforehand
   * @returns UserAccountData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decode(reader: ($protobuf.Reader | Uint8Array), length?: number): UserAccountData;

  /**
   * Decodes a UserAccountData message from the specified reader or buffer, length delimited.
   * @param reader Reader or buffer to decode from
   * @returns UserAccountData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  public static decodeDelimited(reader: ($protobuf.Reader | Uint8Array)): UserAccountData;

  /**
   * Verifies a UserAccountData message.
   * @param message Plain object to verify
   * @returns `null` if valid, otherwise the reason why it is not
   */
  public static verify(message: { [k: string]: any }): (string | null);

  /**
   * Creates a UserAccountData message from a plain object. Also converts values to their respective internal types.
   * @param object Plain object
   * @returns UserAccountData
   */
  public static fromObject(object: { [k: string]: any }): UserAccountData;

  /**
   * Creates a plain object from a UserAccountData message. Also converts values to other types if specified.
   * @param message UserAccountData
   * @param [options] Conversion options
   * @returns Plain object
   */
  public static toObject(message: UserAccountData, options?: $protobuf.IConversionOptions): { [k: string]: any };

  /**
   * Converts this UserAccountData to JSON.
   * @returns JSON object
   */
  public toJSON(): { [k: string]: any };

  /**
   * Gets the default type url for UserAccountData
   * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns The default type url
   */
  public static getTypeUrl(typeUrlPrefix?: string): string;
}
