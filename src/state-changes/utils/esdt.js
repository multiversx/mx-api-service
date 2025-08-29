/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.MetaData = (function () {

    /**
     * Properties of a MetaData.
     * @exports IMetaData
     * @interface IMetaData
     */

    /**
     * Constructs a new MetaData.
     * @exports MetaData
     * @classdesc Represents a MetaData.
     * @implements IMetaData
     * @constructor
     * @param {IMetaData=} [properties] Properties to set
     */
    function MetaData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Creates a new MetaData instance using the specified properties.
     * @function create
     * @memberof MetaData
     * @static
     * @param {IMetaData=} [properties] Properties to set
     * @returns {MetaData} MetaData instance
     */
    MetaData.create = function create(properties) {
        return new MetaData(properties);
    };

    /**
     * Encodes the specified MetaData message. Does not implicitly {@link MetaData.verify|verify} messages.
     * @function encode
     * @memberof MetaData
     * @static
     * @param {IMetaData} message MetaData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MetaData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        return writer;
    };

    /**
     * Encodes the specified MetaData message, length delimited. Does not implicitly {@link MetaData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MetaData
     * @static
     * @param {IMetaData} message MetaData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MetaData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MetaData message from the specified reader or buffer.
     * @function decode
     * @memberof MetaData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MetaData} MetaData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MetaData.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.MetaData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };

    /**
     * Decodes a MetaData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MetaData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MetaData} MetaData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MetaData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MetaData message.
     * @function verify
     * @memberof MetaData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MetaData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        return null;
    };

    /**
     * Creates a MetaData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MetaData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MetaData} MetaData
     */
    MetaData.fromObject = function fromObject(object) {
        if (object instanceof $root.MetaData)
            return object;
        return new $root.MetaData();
    };

    /**
     * Creates a plain object from a MetaData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MetaData
     * @static
     * @param {MetaData} message MetaData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MetaData.toObject = function toObject() {
        return {};
    };

    /**
     * Converts this MetaData to JSON.
     * @function toJSON
     * @memberof MetaData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MetaData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MetaData
     * @function getTypeUrl
     * @memberof MetaData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MetaData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/MetaData";
    };

    return MetaData;
})();

$root.ESDigitalToken = (function () {

    /**
     * Properties of a ESDigitalToken.
     * @exports IESDigitalToken
     * @interface IESDigitalToken
     * @property {number|null} [Type] ESDigitalToken Type
     * @property {Uint8Array|null} [Value] ESDigitalToken Value
     * @property {Uint8Array|null} [Properties] ESDigitalToken Properties
     * @property {IMetaData|null} [TokenMetaData] ESDigitalToken TokenMetaData
     * @property {Uint8Array|null} [Reserved] ESDigitalToken Reserved
     */

    /**
     * Constructs a new ESDigitalToken.
     * @exports ESDigitalToken
     * @classdesc Represents a ESDigitalToken.
     * @implements IESDigitalToken
     * @constructor
     * @param {IESDigitalToken=} [properties] Properties to set
     */
    function ESDigitalToken(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ESDigitalToken Type.
     * @member {number} Type
     * @memberof ESDigitalToken
     * @instance
     */
    ESDigitalToken.prototype.Type = 0;

    /**
     * ESDigitalToken Value.
     * @member {Uint8Array} Value
     * @memberof ESDigitalToken
     * @instance
     */
    ESDigitalToken.prototype.Value = $util.newBuffer([]);

    /**
     * ESDigitalToken Properties.
     * @member {Uint8Array} Properties
     * @memberof ESDigitalToken
     * @instance
     */
    ESDigitalToken.prototype.Properties = $util.newBuffer([]);

    /**
     * ESDigitalToken TokenMetaData.
     * @member {IMetaData|null|undefined} TokenMetaData
     * @memberof ESDigitalToken
     * @instance
     */
    ESDigitalToken.prototype.TokenMetaData = null;

    /**
     * ESDigitalToken Reserved.
     * @member {Uint8Array} Reserved
     * @memberof ESDigitalToken
     * @instance
     */
    ESDigitalToken.prototype.Reserved = $util.newBuffer([]);

    /**
     * Creates a new ESDigitalToken instance using the specified properties.
     * @function create
     * @memberof ESDigitalToken
     * @static
     * @param {IESDigitalToken=} [properties] Properties to set
     * @returns {ESDigitalToken} ESDigitalToken instance
     */
    ESDigitalToken.create = function create(properties) {
        return new ESDigitalToken(properties);
    };

    /**
     * Encodes the specified ESDigitalToken message. Does not implicitly {@link ESDigitalToken.verify|verify} messages.
     * @function encode
     * @memberof ESDigitalToken
     * @static
     * @param {IESDigitalToken} message ESDigitalToken message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ESDigitalToken.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.Type != null && Object.hasOwnProperty.call(message, "Type"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.Type);
        if (message.Value != null && Object.hasOwnProperty.call(message, "Value"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.Value);
        if (message.Properties != null && Object.hasOwnProperty.call(message, "Properties"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.Properties);
        if (message.TokenMetaData != null && Object.hasOwnProperty.call(message, "TokenMetaData"))
            $root.MetaData.encode(message.TokenMetaData, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.Reserved != null && Object.hasOwnProperty.call(message, "Reserved"))
            writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.Reserved);
        return writer;
    };

    /**
     * Encodes the specified ESDigitalToken message, length delimited. Does not implicitly {@link ESDigitalToken.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ESDigitalToken
     * @static
     * @param {IESDigitalToken} message ESDigitalToken message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ESDigitalToken.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ESDigitalToken message from the specified reader or buffer.
     * @function decode
     * @memberof ESDigitalToken
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ESDigitalToken} ESDigitalToken
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ESDigitalToken.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ESDigitalToken();
        while (reader.pos < end) {
            var tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
                case 1: {
                    message.Type = reader.uint32();
                    break;
                }
                case 2: {
                    message.Value = reader.bytes();
                    break;
                }
                case 3: {
                    message.Properties = reader.bytes();
                    break;
                }
                case 4: {
                    message.TokenMetaData = $root.MetaData.decode(reader, reader.uint32());
                    break;
                }
                case 5: {
                    message.Reserved = reader.bytes();
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
     * Decodes a ESDigitalToken message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ESDigitalToken
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ESDigitalToken} ESDigitalToken
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ESDigitalToken.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ESDigitalToken message.
     * @function verify
     * @memberof ESDigitalToken
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ESDigitalToken.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.Type != null && message.hasOwnProperty("Type"))
            if (!$util.isInteger(message.Type))
                return "Type: integer expected";
        if (message.Value != null && message.hasOwnProperty("Value"))
            if (!(message.Value && typeof message.Value.length === "number" || $util.isString(message.Value)))
                return "Value: buffer expected";
        if (message.Properties != null && message.hasOwnProperty("Properties"))
            if (!(message.Properties && typeof message.Properties.length === "number" || $util.isString(message.Properties)))
                return "Properties: buffer expected";
        if (message.TokenMetaData != null && message.hasOwnProperty("TokenMetaData")) {
            var error = $root.MetaData.verify(message.TokenMetaData);
            if (error)
                return "TokenMetaData." + error;
        }
        if (message.Reserved != null && message.hasOwnProperty("Reserved"))
            if (!(message.Reserved && typeof message.Reserved.length === "number" || $util.isString(message.Reserved)))
                return "Reserved: buffer expected";
        return null;
    };

    /**
     * Creates a ESDigitalToken message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ESDigitalToken
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ESDigitalToken} ESDigitalToken
     */
    ESDigitalToken.fromObject = function fromObject(object) {
        if (object instanceof $root.ESDigitalToken)
            return object;
        var message = new $root.ESDigitalToken();
        if (object.Type != null)
            message.Type = object.Type >>> 0;
        if (object.Value != null)
            if (typeof object.Value === "string")
                $util.base64.decode(object.Value, message.Value = $util.newBuffer($util.base64.length(object.Value)), 0);
            else if (object.Value.length >= 0)
                message.Value = object.Value;
        if (object.Properties != null)
            if (typeof object.Properties === "string")
                $util.base64.decode(object.Properties, message.Properties = $util.newBuffer($util.base64.length(object.Properties)), 0);
            else if (object.Properties.length >= 0)
                message.Properties = object.Properties;
        if (object.TokenMetaData != null) {
            if (typeof object.TokenMetaData !== "object")
                throw TypeError(".ESDigitalToken.TokenMetaData: object expected");
            message.TokenMetaData = $root.MetaData.fromObject(object.TokenMetaData);
        }
        if (object.Reserved != null)
            if (typeof object.Reserved === "string")
                $util.base64.decode(object.Reserved, message.Reserved = $util.newBuffer($util.base64.length(object.Reserved)), 0);
            else if (object.Reserved.length >= 0)
                message.Reserved = object.Reserved;
        return message;
    };

    /**
     * Creates a plain object from a ESDigitalToken message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ESDigitalToken
     * @static
     * @param {ESDigitalToken} message ESDigitalToken
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ESDigitalToken.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.Type = 0;
            if (options.bytes === String)
                object.Value = "";
            else {
                object.Value = [];
                if (options.bytes !== Array)
                    object.Value = $util.newBuffer(object.Value);
            }
            if (options.bytes === String)
                object.Properties = "";
            else {
                object.Properties = [];
                if (options.bytes !== Array)
                    object.Properties = $util.newBuffer(object.Properties);
            }
            object.TokenMetaData = null;
            if (options.bytes === String)
                object.Reserved = "";
            else {
                object.Reserved = [];
                if (options.bytes !== Array)
                    object.Reserved = $util.newBuffer(object.Reserved);
            }
        }
        if (message.Type != null && message.hasOwnProperty("Type"))
            object.Type = message.Type;
        if (message.Value != null && message.hasOwnProperty("Value"))
            object.Value = options.bytes === String ? $util.base64.encode(message.Value, 0, message.Value.length) : options.bytes === Array ? Array.prototype.slice.call(message.Value) : message.Value;
        if (message.Properties != null && message.hasOwnProperty("Properties"))
            object.Properties = options.bytes === String ? $util.base64.encode(message.Properties, 0, message.Properties.length) : options.bytes === Array ? Array.prototype.slice.call(message.Properties) : message.Properties;
        if (message.TokenMetaData != null && message.hasOwnProperty("TokenMetaData"))
            object.TokenMetaData = $root.MetaData.toObject(message.TokenMetaData, options);
        if (message.Reserved != null && message.hasOwnProperty("Reserved"))
            object.Reserved = options.bytes === String ? $util.base64.encode(message.Reserved, 0, message.Reserved.length) : options.bytes === Array ? Array.prototype.slice.call(message.Reserved) : message.Reserved;
        return object;
    };

    /**
     * Converts this ESDigitalToken to JSON.
     * @function toJSON
     * @memberof ESDigitalToken
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ESDigitalToken.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ESDigitalToken
     * @function getTypeUrl
     * @memberof ESDigitalToken
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ESDigitalToken.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ESDigitalToken";
    };

    return ESDigitalToken;
})();

module.exports = $root;
