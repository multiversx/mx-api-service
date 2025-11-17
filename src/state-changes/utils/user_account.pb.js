/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.UserAccountData = (function () {

  /**
   * Properties of a UserAccountData.
   * @exports IUserAccountData
   * @interface IUserAccountData
   * @property {number|Long|null} [Nonce] UserAccountData Nonce
   * @property {Uint8Array|null} [Balance] UserAccountData Balance
   * @property {Uint8Array|null} [CodeHash] UserAccountData CodeHash
   * @property {Uint8Array|null} [RootHash] UserAccountData RootHash
   * @property {Uint8Array|null} [Address] UserAccountData Address
   * @property {Uint8Array|null} [DeveloperReward] UserAccountData DeveloperReward
   * @property {Uint8Array|null} [OwnerAddress] UserAccountData OwnerAddress
   * @property {Uint8Array|null} [UserName] UserAccountData UserName
   * @property {Uint8Array|null} [CodeMetadata] UserAccountData CodeMetadata
   */

  /**
   * Constructs a new UserAccountData.
   * @exports UserAccountData
   * @classdesc Represents a UserAccountData.
   * @implements IUserAccountData
   * @constructor
   * @param {IUserAccountData=} [properties] Properties to set
   */
  function UserAccountData(properties) {
    if (properties)
      for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
        if (properties[keys[i]] != null)
          this[keys[i]] = properties[keys[i]];
  }

  /**
   * UserAccountData Nonce.
   * @member {number|Long} Nonce
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.Nonce = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

  /**
   * UserAccountData Balance.
   * @member {Uint8Array} Balance
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.Balance = $util.newBuffer([]);

  /**
   * UserAccountData CodeHash.
   * @member {Uint8Array} CodeHash
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.CodeHash = $util.newBuffer([]);

  /**
   * UserAccountData RootHash.
   * @member {Uint8Array} RootHash
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.RootHash = $util.newBuffer([]);

  /**
   * UserAccountData Address.
   * @member {Uint8Array} Address
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.Address = $util.newBuffer([]);

  /**
   * UserAccountData DeveloperReward.
   * @member {Uint8Array} DeveloperReward
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.DeveloperReward = $util.newBuffer([]);

  /**
   * UserAccountData OwnerAddress.
   * @member {Uint8Array} OwnerAddress
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.OwnerAddress = $util.newBuffer([]);

  /**
   * UserAccountData UserName.
   * @member {Uint8Array} UserName
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.UserName = $util.newBuffer([]);

  /**
   * UserAccountData CodeMetadata.
   * @member {Uint8Array} CodeMetadata
   * @memberof UserAccountData
   * @instance
   */
  UserAccountData.prototype.CodeMetadata = $util.newBuffer([]);

  /**
   * Creates a new UserAccountData instance using the specified properties.
   * @function create
   * @memberof UserAccountData
   * @static
   * @param {IUserAccountData=} [properties] Properties to set
   * @returns {UserAccountData} UserAccountData instance
   */
  UserAccountData.create = function create(properties) {
    return new UserAccountData(properties);
  };

  /**
   * Encodes the specified UserAccountData message. Does not implicitly {@link UserAccountData.verify|verify} messages.
   * @function encode
   * @memberof UserAccountData
   * @static
   * @param {IUserAccountData} message UserAccountData message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  UserAccountData.encode = function encode(message, writer) {
    if (!writer)
      writer = $Writer.create();
    if (message.Nonce != null && Object.hasOwnProperty.call(message, "Nonce"))
      writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.Nonce);
    if (message.Balance != null && Object.hasOwnProperty.call(message, "Balance"))
      writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.Balance);
    if (message.CodeHash != null && Object.hasOwnProperty.call(message, "CodeHash"))
      writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.CodeHash);
    if (message.RootHash != null && Object.hasOwnProperty.call(message, "RootHash"))
      writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.RootHash);
    if (message.Address != null && Object.hasOwnProperty.call(message, "Address"))
      writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.Address);
    if (message.DeveloperReward != null && Object.hasOwnProperty.call(message, "DeveloperReward"))
      writer.uint32(/* id 6, wireType 2 =*/50).bytes(message.DeveloperReward);
    if (message.OwnerAddress != null && Object.hasOwnProperty.call(message, "OwnerAddress"))
      writer.uint32(/* id 7, wireType 2 =*/58).bytes(message.OwnerAddress);
    if (message.UserName != null && Object.hasOwnProperty.call(message, "UserName"))
      writer.uint32(/* id 8, wireType 2 =*/66).bytes(message.UserName);
    if (message.CodeMetadata != null && Object.hasOwnProperty.call(message, "CodeMetadata"))
      writer.uint32(/* id 9, wireType 2 =*/74).bytes(message.CodeMetadata);
    return writer;
  };

  /**
   * Encodes the specified UserAccountData message, length delimited. Does not implicitly {@link UserAccountData.verify|verify} messages.
   * @function encodeDelimited
   * @memberof UserAccountData
   * @static
   * @param {IUserAccountData} message UserAccountData message or plain object to encode
   * @param {$protobuf.Writer} [writer] Writer to encode to
   * @returns {$protobuf.Writer} Writer
   */
  UserAccountData.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  };

  /**
   * Decodes a UserAccountData message from the specified reader or buffer.
   * @function decode
   * @memberof UserAccountData
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @param {number} [length] Message length if known beforehand
   * @returns {UserAccountData} UserAccountData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  UserAccountData.decode = function decode(reader, length, error) {
    if (!(reader instanceof $Reader))
      reader = $Reader.create(reader);
    var end = length === undefined ? reader.len : reader.pos + length, message = new $root.UserAccountData();
    while (reader.pos < end) {
      var tag = reader.uint32();
      if (tag === error)
        break;
      switch (tag >>> 3) {
        case 1: {
          message.Nonce = reader.uint64();
          break;
        }
        case 2: {
          message.Balance = reader.bytes();
          break;
        }
        case 3: {
          message.CodeHash = reader.bytes();
          break;
        }
        case 4: {
          message.RootHash = reader.bytes();
          break;
        }
        case 5: {
          message.Address = reader.bytes();
          break;
        }
        case 6: {
          message.DeveloperReward = reader.bytes();
          break;
        }
        case 7: {
          message.OwnerAddress = reader.bytes();
          break;
        }
        case 8: {
          message.UserName = reader.bytes();
          break;
        }
        case 9: {
          message.CodeMetadata = reader.bytes();
          break;
        }
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  };

  /**
   * Decodes a UserAccountData message from the specified reader or buffer, length delimited.
   * @function decodeDelimited
   * @memberof UserAccountData
   * @static
   * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
   * @returns {UserAccountData} UserAccountData
   * @throws {Error} If the payload is not a reader or valid buffer
   * @throws {$protobuf.util.ProtocolError} If required fields are missing
   */
  UserAccountData.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof $Reader))
      reader = new $Reader(reader);
    return this.decode(reader, reader.uint32());
  };

  /**
   * Verifies a UserAccountData message.
   * @function verify
   * @memberof UserAccountData
   * @static
   * @param {Object.<string,*>} message Plain object to verify
   * @returns {string|null} `null` if valid, otherwise the reason why it is not
   */
  UserAccountData.verify = function verify(message) {
    if (typeof message !== "object" || message === null)
      return "object expected";
    if (message.Nonce != null && message.hasOwnProperty("Nonce"))
      if (!$util.isInteger(message.Nonce) && !(message.Nonce && $util.isInteger(message.Nonce.low) && $util.isInteger(message.Nonce.high)))
        return "Nonce: integer|Long expected";
    if (message.Balance != null && message.hasOwnProperty("Balance"))
      if (!(message.Balance && typeof message.Balance.length === "number" || $util.isString(message.Balance)))
        return "Balance: buffer expected";
    if (message.CodeHash != null && message.hasOwnProperty("CodeHash"))
      if (!(message.CodeHash && typeof message.CodeHash.length === "number" || $util.isString(message.CodeHash)))
        return "CodeHash: buffer expected";
    if (message.RootHash != null && message.hasOwnProperty("RootHash"))
      if (!(message.RootHash && typeof message.RootHash.length === "number" || $util.isString(message.RootHash)))
        return "RootHash: buffer expected";
    if (message.Address != null && message.hasOwnProperty("Address"))
      if (!(message.Address && typeof message.Address.length === "number" || $util.isString(message.Address)))
        return "Address: buffer expected";
    if (message.DeveloperReward != null && message.hasOwnProperty("DeveloperReward"))
      if (!(message.DeveloperReward && typeof message.DeveloperReward.length === "number" || $util.isString(message.DeveloperReward)))
        return "DeveloperReward: buffer expected";
    if (message.OwnerAddress != null && message.hasOwnProperty("OwnerAddress"))
      if (!(message.OwnerAddress && typeof message.OwnerAddress.length === "number" || $util.isString(message.OwnerAddress)))
        return "OwnerAddress: buffer expected";
    if (message.UserName != null && message.hasOwnProperty("UserName"))
      if (!(message.UserName && typeof message.UserName.length === "number" || $util.isString(message.UserName)))
        return "UserName: buffer expected";
    if (message.CodeMetadata != null && message.hasOwnProperty("CodeMetadata"))
      if (!(message.CodeMetadata && typeof message.CodeMetadata.length === "number" || $util.isString(message.CodeMetadata)))
        return "CodeMetadata: buffer expected";
    return null;
  };

  /**
   * Creates a UserAccountData message from a plain object. Also converts values to their respective internal types.
   * @function fromObject
   * @memberof UserAccountData
   * @static
   * @param {Object.<string,*>} object Plain object
   * @returns {UserAccountData} UserAccountData
   */
  UserAccountData.fromObject = function fromObject(object) {
    if (object instanceof $root.UserAccountData)
      return object;
    var message = new $root.UserAccountData();
    if (object.Nonce != null)
      if ($util.Long)
        (message.Nonce = $util.Long.fromValue(object.Nonce)).unsigned = true;
      else if (typeof object.Nonce === "string")
        message.Nonce = parseInt(object.Nonce, 10);
      else if (typeof object.Nonce === "number")
        message.Nonce = object.Nonce;
      else if (typeof object.Nonce === "object")
        message.Nonce = new $util.LongBits(object.Nonce.low >>> 0, object.Nonce.high >>> 0).toNumber(true);
    if (object.Balance != null)
      if (typeof object.Balance === "string")
        $util.base64.decode(object.Balance, message.Balance = $util.newBuffer($util.base64.length(object.Balance)), 0);
      else if (object.Balance.length >= 0)
        message.Balance = object.Balance;
    if (object.CodeHash != null)
      if (typeof object.CodeHash === "string")
        $util.base64.decode(object.CodeHash, message.CodeHash = $util.newBuffer($util.base64.length(object.CodeHash)), 0);
      else if (object.CodeHash.length >= 0)
        message.CodeHash = object.CodeHash;
    if (object.RootHash != null)
      if (typeof object.RootHash === "string")
        $util.base64.decode(object.RootHash, message.RootHash = $util.newBuffer($util.base64.length(object.RootHash)), 0);
      else if (object.RootHash.length >= 0)
        message.RootHash = object.RootHash;
    if (object.Address != null)
      if (typeof object.Address === "string")
        $util.base64.decode(object.Address, message.Address = $util.newBuffer($util.base64.length(object.Address)), 0);
      else if (object.Address.length >= 0)
        message.Address = object.Address;
    if (object.DeveloperReward != null)
      if (typeof object.DeveloperReward === "string")
        $util.base64.decode(object.DeveloperReward, message.DeveloperReward = $util.newBuffer($util.base64.length(object.DeveloperReward)), 0);
      else if (object.DeveloperReward.length >= 0)
        message.DeveloperReward = object.DeveloperReward;
    if (object.OwnerAddress != null)
      if (typeof object.OwnerAddress === "string")
        $util.base64.decode(object.OwnerAddress, message.OwnerAddress = $util.newBuffer($util.base64.length(object.OwnerAddress)), 0);
      else if (object.OwnerAddress.length >= 0)
        message.OwnerAddress = object.OwnerAddress;
    if (object.UserName != null)
      if (typeof object.UserName === "string")
        $util.base64.decode(object.UserName, message.UserName = $util.newBuffer($util.base64.length(object.UserName)), 0);
      else if (object.UserName.length >= 0)
        message.UserName = object.UserName;
    if (object.CodeMetadata != null)
      if (typeof object.CodeMetadata === "string")
        $util.base64.decode(object.CodeMetadata, message.CodeMetadata = $util.newBuffer($util.base64.length(object.CodeMetadata)), 0);
      else if (object.CodeMetadata.length >= 0)
        message.CodeMetadata = object.CodeMetadata;
    return message;
  };

  /**
   * Creates a plain object from a UserAccountData message. Also converts values to other types if specified.
   * @function toObject
   * @memberof UserAccountData
   * @static
   * @param {UserAccountData} message UserAccountData
   * @param {$protobuf.IConversionOptions} [options] Conversion options
   * @returns {Object.<string,*>} Plain object
   */
  UserAccountData.toObject = function toObject(message, options) {
    if (!options)
      options = {};
    var object = {};
    if (options.defaults) {
      if ($util.Long) {
        var long = new $util.Long(0, 0, true);
        object.Nonce = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else
        object.Nonce = options.longs === String ? "0" : 0;
      if (options.bytes === String)
        object.Balance = "";
      else {
        object.Balance = [];
        if (options.bytes !== Array)
          object.Balance = $util.newBuffer(object.Balance);
      }
      if (options.bytes === String)
        object.CodeHash = "";
      else {
        object.CodeHash = [];
        if (options.bytes !== Array)
          object.CodeHash = $util.newBuffer(object.CodeHash);
      }
      if (options.bytes === String)
        object.RootHash = "";
      else {
        object.RootHash = [];
        if (options.bytes !== Array)
          object.RootHash = $util.newBuffer(object.RootHash);
      }
      if (options.bytes === String)
        object.Address = "";
      else {
        object.Address = [];
        if (options.bytes !== Array)
          object.Address = $util.newBuffer(object.Address);
      }
      if (options.bytes === String)
        object.DeveloperReward = "";
      else {
        object.DeveloperReward = [];
        if (options.bytes !== Array)
          object.DeveloperReward = $util.newBuffer(object.DeveloperReward);
      }
      if (options.bytes === String)
        object.OwnerAddress = "";
      else {
        object.OwnerAddress = [];
        if (options.bytes !== Array)
          object.OwnerAddress = $util.newBuffer(object.OwnerAddress);
      }
      if (options.bytes === String)
        object.UserName = "";
      else {
        object.UserName = [];
        if (options.bytes !== Array)
          object.UserName = $util.newBuffer(object.UserName);
      }
      if (options.bytes === String)
        object.CodeMetadata = "";
      else {
        object.CodeMetadata = [];
        if (options.bytes !== Array)
          object.CodeMetadata = $util.newBuffer(object.CodeMetadata);
      }
    }
    if (message.Nonce != null && message.hasOwnProperty("Nonce"))
      if (typeof message.Nonce === "number")
        object.Nonce = options.longs === String ? String(message.Nonce) : message.Nonce;
      else
        object.Nonce = options.longs === String ? $util.Long.prototype.toString.call(message.Nonce) : options.longs === Number ? new $util.LongBits(message.Nonce.low >>> 0, message.Nonce.high >>> 0).toNumber(true) : message.Nonce;
    if (message.Balance != null && message.hasOwnProperty("Balance"))
      object.Balance = options.bytes === String ? $util.base64.encode(message.Balance, 0, message.Balance.length) : options.bytes === Array ? Array.prototype.slice.call(message.Balance) : message.Balance;
    if (message.CodeHash != null && message.hasOwnProperty("CodeHash"))
      object.CodeHash = options.bytes === String ? $util.base64.encode(message.CodeHash, 0, message.CodeHash.length) : options.bytes === Array ? Array.prototype.slice.call(message.CodeHash) : message.CodeHash;
    if (message.RootHash != null && message.hasOwnProperty("RootHash"))
      object.RootHash = options.bytes === String ? $util.base64.encode(message.RootHash, 0, message.RootHash.length) : options.bytes === Array ? Array.prototype.slice.call(message.RootHash) : message.RootHash;
    if (message.Address != null && message.hasOwnProperty("Address"))
      object.Address = options.bytes === String ? $util.base64.encode(message.Address, 0, message.Address.length) : options.bytes === Array ? Array.prototype.slice.call(message.Address) : message.Address;
    if (message.DeveloperReward != null && message.hasOwnProperty("DeveloperReward"))
      object.DeveloperReward = options.bytes === String ? $util.base64.encode(message.DeveloperReward, 0, message.DeveloperReward.length) : options.bytes === Array ? Array.prototype.slice.call(message.DeveloperReward) : message.DeveloperReward;
    if (message.OwnerAddress != null && message.hasOwnProperty("OwnerAddress"))
      object.OwnerAddress = options.bytes === String ? $util.base64.encode(message.OwnerAddress, 0, message.OwnerAddress.length) : options.bytes === Array ? Array.prototype.slice.call(message.OwnerAddress) : message.OwnerAddress;
    if (message.UserName != null && message.hasOwnProperty("UserName"))
      object.UserName = options.bytes === String ? $util.base64.encode(message.UserName, 0, message.UserName.length) : options.bytes === Array ? Array.prototype.slice.call(message.UserName) : message.UserName;
    if (message.CodeMetadata != null && message.hasOwnProperty("CodeMetadata"))
      object.CodeMetadata = options.bytes === String ? $util.base64.encode(message.CodeMetadata, 0, message.CodeMetadata.length) : options.bytes === Array ? Array.prototype.slice.call(message.CodeMetadata) : message.CodeMetadata;
    return object;
  };

  /**
   * Converts this UserAccountData to JSON.
   * @function toJSON
   * @memberof UserAccountData
   * @instance
   * @returns {Object.<string,*>} JSON object
   */
  UserAccountData.prototype.toJSON = function toJSON() {
    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
  };

  /**
   * Gets the default type url for UserAccountData
   * @function getTypeUrl
   * @memberof UserAccountData
   * @static
   * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
   * @returns {string} The default type url
   */
  UserAccountData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
    if (typeUrlPrefix === undefined) {
      typeUrlPrefix = "type.googleapis.com";
    }
    return typeUrlPrefix + "/UserAccountData";
  };

  return UserAccountData;
})();

module.exports = $root;
