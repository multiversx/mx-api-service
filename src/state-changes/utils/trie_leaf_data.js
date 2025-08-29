/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.TrieLeafData = (function() {

    /**
     * Properties of a TrieLeafData.
     * @exports ITrieLeafData
     * @interface ITrieLeafData
     * @property {Uint8Array|null} [value] TrieLeafData value
     * @property {Uint8Array|null} [key] TrieLeafData key
     * @property {Uint8Array|null} [address] TrieLeafData address
     */

    /**
     * Constructs a new TrieLeafData.
     * @exports TrieLeafData
     * @classdesc Represents a TrieLeafData.
     * @implements ITrieLeafData
     * @constructor
     * @param {ITrieLeafData=} [properties] Properties to set
     */
    function TrieLeafData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * TrieLeafData value.
     * @member {Uint8Array} value
     * @memberof TrieLeafData
     * @instance
     */
    TrieLeafData.prototype.value = $util.newBuffer([]);

    /**
     * TrieLeafData key.
     * @member {Uint8Array} key
     * @memberof TrieLeafData
     * @instance
     */
    TrieLeafData.prototype.key = $util.newBuffer([]);

    /**
     * TrieLeafData address.
     * @member {Uint8Array} address
     * @memberof TrieLeafData
     * @instance
     */
    TrieLeafData.prototype.address = $util.newBuffer([]);

    /**
     * Creates a new TrieLeafData instance using the specified properties.
     * @function create
     * @memberof TrieLeafData
     * @static
     * @param {ITrieLeafData=} [properties] Properties to set
     * @returns {TrieLeafData} TrieLeafData instance
     */
    TrieLeafData.create = function create(properties) {
        return new TrieLeafData(properties);
    };

    /**
     * Encodes the specified TrieLeafData message. Does not implicitly {@link TrieLeafData.verify|verify} messages.
     * @function encode
     * @memberof TrieLeafData
     * @static
     * @param {ITrieLeafData} message TrieLeafData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TrieLeafData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.value);
        if (message.key != null && Object.hasOwnProperty.call(message, "key"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.key);
        if (message.address != null && Object.hasOwnProperty.call(message, "address"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.address);
        return writer;
    };

    /**
     * Encodes the specified TrieLeafData message, length delimited. Does not implicitly {@link TrieLeafData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof TrieLeafData
     * @static
     * @param {ITrieLeafData} message TrieLeafData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TrieLeafData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TrieLeafData message from the specified reader or buffer.
     * @function decode
     * @memberof TrieLeafData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {TrieLeafData} TrieLeafData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TrieLeafData.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.TrieLeafData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.value = reader.bytes();
                    break;
                }
            case 2: {
                    message.key = reader.bytes();
                    break;
                }
            case 3: {
                    message.address = reader.bytes();
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
     * Decodes a TrieLeafData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof TrieLeafData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {TrieLeafData} TrieLeafData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TrieLeafData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TrieLeafData message.
     * @function verify
     * @memberof TrieLeafData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TrieLeafData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.value != null && message.hasOwnProperty("value"))
            if (!(message.value && typeof message.value.length === "number" || $util.isString(message.value)))
                return "value: buffer expected";
        if (message.key != null && message.hasOwnProperty("key"))
            if (!(message.key && typeof message.key.length === "number" || $util.isString(message.key)))
                return "key: buffer expected";
        if (message.address != null && message.hasOwnProperty("address"))
            if (!(message.address && typeof message.address.length === "number" || $util.isString(message.address)))
                return "address: buffer expected";
        return null;
    };

    /**
     * Creates a TrieLeafData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof TrieLeafData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {TrieLeafData} TrieLeafData
     */
    TrieLeafData.fromObject = function fromObject(object) {
        if (object instanceof $root.TrieLeafData)
            return object;
        var message = new $root.TrieLeafData();
        if (object.value != null)
            if (typeof object.value === "string")
                $util.base64.decode(object.value, message.value = $util.newBuffer($util.base64.length(object.value)), 0);
            else if (object.value.length >= 0)
                message.value = object.value;
        if (object.key != null)
            if (typeof object.key === "string")
                $util.base64.decode(object.key, message.key = $util.newBuffer($util.base64.length(object.key)), 0);
            else if (object.key.length >= 0)
                message.key = object.key;
        if (object.address != null)
            if (typeof object.address === "string")
                $util.base64.decode(object.address, message.address = $util.newBuffer($util.base64.length(object.address)), 0);
            else if (object.address.length >= 0)
                message.address = object.address;
        return message;
    };

    /**
     * Creates a plain object from a TrieLeafData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof TrieLeafData
     * @static
     * @param {TrieLeafData} message TrieLeafData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TrieLeafData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if (options.bytes === String)
                object.value = "";
            else {
                object.value = [];
                if (options.bytes !== Array)
                    object.value = $util.newBuffer(object.value);
            }
            if (options.bytes === String)
                object.key = "";
            else {
                object.key = [];
                if (options.bytes !== Array)
                    object.key = $util.newBuffer(object.key);
            }
            if (options.bytes === String)
                object.address = "";
            else {
                object.address = [];
                if (options.bytes !== Array)
                    object.address = $util.newBuffer(object.address);
            }
        }
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = options.bytes === String ? $util.base64.encode(message.value, 0, message.value.length) : options.bytes === Array ? Array.prototype.slice.call(message.value) : message.value;
        if (message.key != null && message.hasOwnProperty("key"))
            object.key = options.bytes === String ? $util.base64.encode(message.key, 0, message.key.length) : options.bytes === Array ? Array.prototype.slice.call(message.key) : message.key;
        if (message.address != null && message.hasOwnProperty("address"))
            object.address = options.bytes === String ? $util.base64.encode(message.address, 0, message.address.length) : options.bytes === Array ? Array.prototype.slice.call(message.address) : message.address;
        return object;
    };

    /**
     * Converts this TrieLeafData to JSON.
     * @function toJSON
     * @memberof TrieLeafData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TrieLeafData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TrieLeafData
     * @function getTypeUrl
     * @memberof TrieLeafData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TrieLeafData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/TrieLeafData";
    };

    return TrieLeafData;
})();

module.exports = $root;
