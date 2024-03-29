"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
const BinaryCoder_1 = require("./BinaryCoder");
const Type_1 = require("./Type");
/**
 * Parse and represent an object field. See example in Type.js
 */
class Field {
    constructor(name, rawType) {
        this.isOptional = rawType instanceof Type_1.OptionalType;
        let type = rawType instanceof Type_1.OptionalType ? rawType.type : rawType;
        this.name = name;
        if (Array.isArray(type)) {
            if (type.length !== 1) {
                throw new TypeError('Invalid array definition, it must have exactly one element');
            }
            type = type[0];
            this.isArray = true;
        }
        else {
            this.isArray = false;
        }
        this.coder = new BinaryCoder_1.BinaryCoder(type);
    }
    /**
     * @returns A string identifying the encoding format.
     * @example "{str,uint16,bool}[]?"
     */
    get format() {
        if (this._format === undefined) {
            this._format = `${this.coder.format}${this.isArray ? '[]' : ''}${this.isOptional ? '?' : ''}`;
        }
        return this._format;
    }
}
exports.Field = Field;
exports.default = Field;
//# sourceMappingURL=Field.js.map