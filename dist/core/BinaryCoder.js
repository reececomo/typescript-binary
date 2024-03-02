"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryCoder = void 0;
const coders = __importStar(require("./lib/coders"));
const Field_1 = require("./Field");
const hashCode_1 = require("./lib/hashCode");
const MutableArrayBuffer_1 = require("./MutableArrayBuffer");
const ReadState_1 = require("./ReadState");
const Type_1 = require("./Type");
/**
 * BinaryCoder is a utility class for encoding and decoding binary data based
 * on a provided encoding format.
 *
 * @see {Id}
 * @see {hashCode}
 * @see {encode(data)}
 * @see {decode(binary)}
 */
class BinaryCoder {
    /**
     * @param encoderDefinition A defined encoding format.
     * @param Id Defaults to hash code. Set `false` to disable. Must be a 16-bit unsigned integer.
     */
    constructor(encoderDefinition, Id) {
        if (Id !== undefined
            && Id !== false
            && !(typeof Id === 'number' && Id >= 0 && Id <= 65535 && Math.floor(Id) === Id)) {
            throw new TypeError('Id must be uint16 or `false`');
        }
        else if (encoderDefinition instanceof Type_1.OptionalType) {
            throw new TypeError("Invalid type given. Root object must not be an Optional.");
        }
        else if (typeof encoderDefinition === 'object') {
            this.type = "{object}" /* Type.Object */;
            this.fields = Object.keys(encoderDefinition).map(function (name) {
                return new Field_1.Field(name, encoderDefinition[name]);
            });
        }
        else if (encoderDefinition !== undefined && typeof encoderDefinition === 'string' && Type_1.ValidValueTypes.includes(encoderDefinition)) {
            this.type = encoderDefinition;
        }
        else {
            throw new TypeError("Invalid type given. Must be an object, or a known coder type.");
        }
        // Create a hash code
        this.Id = Id === undefined && this.type === "{object}" /* Type.Object */ ? (0, hashCode_1.generateObjectShapeHashCode)(encoderDefinition) : typeof Id === 'number' ? Id : undefined;
    }
    // ----- Static methods: -----
    /**
     * Read the first two bytes of a buffer.
     *
     * When passed an ArrayBufferView, accesses the underlying 'buffer' instance directly.
     *
     * @see {BinaryCoder.Id}
     * @throws {RangeError} if buffer size < 2
     */
    static peekId(buffer) {
        const dataView = new DataView(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
        return dataView.getUint16(0);
    }
    // ----- Public methods: -----
    /**
     * Encode an object to binary.
     *
     * @throws if the value is invalid
     */
    encode(value) {
        const data = new MutableArrayBuffer_1.MutableArrayBuffer();
        this.writeId(data);
        this.write(value, data, '');
        return data.toArrayBuffer();
    }
    /**
     * Decode binary data to an object.
     *
     * @throws if fails (e.g. binary data is incompatible with schema).
     */
    decode(arrayBuffer) {
        return this.read(new ReadState_1.ReadState(arrayBuffer instanceof ArrayBuffer ? arrayBuffer : arrayBuffer.buffer, this.Id === undefined ? 0 : 2));
    }
    // ----- Implementation: -----
    /**
     * @param value
     * @param data
     * @param path
     * @throws if the value is invalid
     */
    write(value, data, path) {
        let field, subpath, subValue;
        if (this.type !== "{object}" /* Type.Object */) {
            return this.getCoder(this.type).write(value, data, path);
        }
        // Check for object type
        if (!value || typeof value !== 'object') {
            throw new TypeError('Expected an object at ' + path);
        }
        // Write each field
        for (let i = 0, len = this.fields.length; i < len; i++) {
            field = this.fields[i];
            subpath = path ? path + '.' + field.name : field.name;
            subValue = value[field.name];
            if (field.isOptional) {
                // Add 'presence' flag
                if (subValue === undefined || subValue === null) {
                    coders.booleanCoder.write(false, data);
                    continue;
                }
                else {
                    coders.booleanCoder.write(true, data);
                }
            }
            if (!field.isArray) {
                // Scalar field
                field.type.write(subValue, data, subpath);
                continue;
            }
            // Array field
            this._writeArray(subValue, data, subpath, field.type);
        }
    }
    /**
     * Writes @see {Id} as the prefix of the buffer.
     */
    writeId(mutableArrayBuffer) {
        if (this.Id === undefined) {
            return;
        }
        coders.uint16Coder.write(this.Id, mutableArrayBuffer, '');
    }
    /**
     * Helper to get the right coder.
     */
    getCoder(type) {
        switch (type) {
            case "binary" /* Type.Binary */: return coders.arrayBufferCoder;
            case "bitmask16" /* Type.Bitmask16 */: return coders.bitmask16Coder;
            case "bitmask32" /* Type.Bitmask32 */: return coders.bitmask32Coder;
            case "bitmask8" /* Type.Bitmask8 */: return coders.bitmask8Coder;
            case "bool" /* Type.Boolean */: return coders.booleanCoder;
            case "booltuple" /* Type.BooleanTuple */: return coders.booleanArrayCoder;
            case "date" /* Type.Date */: return coders.dateCoder;
            case "float16" /* Type.Float16 */: return coders.float16Coder;
            case "float32" /* Type.Float32 */: return coders.float32Coder;
            case "float64" /* Type.Float64 */: return coders.float64Coder;
            case "int" /* Type.Int */: return coders.intCoder;
            case "int16" /* Type.Int16 */: return coders.int16Coder;
            case "int32" /* Type.Int32 */: return coders.int32Coder;
            case "int8" /* Type.Int8 */: return coders.int8Coder;
            case "json" /* Type.JSON */: return coders.jsonCoder;
            case "regex" /* Type.RegExp */: return coders.regexCoder;
            case "str" /* Type.String */: return coders.stringCoder;
            case "uint" /* Type.UInt */: return coders.uintCoder;
            case "uint16" /* Type.UInt16 */: return coders.uint16Coder;
            case "uint32" /* Type.UInt32 */: return coders.uint32Coder;
            case "uint8" /* Type.UInt8 */: return coders.uint8Coder;
        }
    }
    // ----- Private methods: -----
    /**
     * This function will be executed only the first time
     * After that, we'll compile the read routine and add it directly to the instance
     * @param state
     * @returns
     * @throws if fails
     */
    read(state) {
        this.read = this.compileRead();
        return this.read(state);
    }
    /**
     * Compile the decode method for this object.
     */
    compileRead() {
        if (this.type !== "{object}" /* Type.Object */ && this.type !== "[array]" /* Type.Array */) {
            // Scalar type
            // In this case, there is no need to write custom code
            return this.getCoder(this.type).read;
        }
        // As an example, compiling code to new Type({a:'int', 'b?':['string']}) will result in:
        // return {
        //     a: this.fields[0].type.read(state),
        //     b: this._readOptional(state) ? this._readArray(state, this.fields[1].type) : undefined
        // }
        let code = 'return {' + this.fields.map(function (field, i) {
            let name = JSON.stringify(field.name), fieldStr = 'this.fields[' + i + ']', readCode, code;
            if (field.isArray) {
                readCode = 'this._readArray(' + fieldStr + '.type, state)';
            }
            else {
                readCode = fieldStr + '.type.read(state)';
            }
            if (!field.isOptional) {
                code = name + ': ' + readCode;
            }
            else {
                code = name + ': this._readOptional(state) ? ' + readCode + ' : undefined';
            }
            return code;
        }).join(',') + '}';
        return new Function('state', code);
    }
    /**
     * @param value
     * @param data
     * @param path
     * @param type
     * @throws if the value is invalid
     */
    _writeArray(value, data, path, type) {
        let i, len;
        if (!Array.isArray(value)) {
            throw new coders.WriteTypeError(`Array<${type.type}>`, data, path);
        }
        len = value.length;
        coders.uintCoder.write(len, data);
        for (i = 0; i < len; i++) {
            type.write(value[i], data, path + '.' + i);
        }
    }
    /**
     * @throws if invalid data
     */
    _readArray(type, state) {
        let arr = new Array(coders.uintCoder.read(state)), j;
        for (j = 0; j < arr.length; j++) {
            arr[j] = type.read(state);
        }
        return arr;
    }
    _readOptional(state) {
        return coders.booleanCoder.read(state);
    }
}
exports.BinaryCoder = BinaryCoder;
exports.default = BinaryCoder;
//# sourceMappingURL=BinaryCoder.js.map