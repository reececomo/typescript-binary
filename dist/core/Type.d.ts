/**
 * Mappings for the value types.
 */
export type ValueTypes = {
    [Type.Float16]: number;
    [Type.Float32]: number;
    [Type.Float64]: number;
    [Type.Int]: number;
    [Type.Int8]: number;
    [Type.Int16]: number;
    [Type.Int32]: number;
    [Type.UInt]: number;
    [Type.UInt8]: number;
    [Type.UInt16]: number;
    [Type.UInt32]: number;
    [Type.UScalar]: number;
    [Type.Scalar]: number;
    [Type.Boolean]: boolean;
    [Type.BooleanTuple]: boolean[];
    [Type.Bitmask8]: boolean[];
    [Type.Bitmask16]: boolean[];
    [Type.Bitmask32]: boolean[];
    [Type.String]: string;
    [Type.Date]: Date;
    [Type.RegExp]: RegExp;
    [Type.JSON]: any;
    [Type.Binary]: ArrayBuffer;
};
/** @throws any error too */
export type ValidationFn<T> = (x: T) => undefined | boolean | Error;
export type TransformFn<T> = (x: T) => T;
export type Transforms<T> = TransformFn<T> | [preEncode: TransformFn<T>] | [preEncode: TransformFn<T> | undefined, postDecode: TransformFn<T> | undefined];
/**
 * A wrapper around any Type definition that declares it as optional.
 */
export declare class OptionalType<T extends FieldDefinition> {
    type: T;
    constructor(type: T);
}
/**
 * Wrap any definition as optional.
 */
export declare function Optional<T extends FieldDefinition>(t: T): OptionalType<T>;
/**
 * A definition for an object binary encoder.
 */
export type EncoderDefinition = {
    [key: string]: FieldDefinition | OptionalType<FieldDefinition>;
};
/**
 * Definition for an object-field binary encoder.
 */
export type FieldDefinition = keyof ValueTypes | [keyof ValueTypes] | EncoderDefinition | [EncoderDefinition] | OptionalType<FieldDefinition>;
/**
 * The resulting type of the decoded data, based on the encoder definition.
 */
export type InferredDecodedType<EncoderType extends EncoderDefinition> = {
    [EKey in keyof EncoderType as EncoderType[EKey] extends OptionalType<any> ? never : EKey]: EncoderType[EKey] extends keyof ValueTypes ? ValueTypes[EncoderType[EKey]] : EncoderType[EKey] extends [keyof ValueTypes] ? Array<ValueTypes[EncoderType[EKey][0]]> : EncoderType[EKey] extends EncoderDefinition ? InferredDecodedType<EncoderType[EKey]> : EncoderType[EKey] extends [EncoderDefinition] ? Array<InferredDecodedType<EncoderType[EKey][number]>> : never;
} & {
    [EKey in keyof EncoderType as EncoderType[EKey] extends OptionalType<any> ? EKey : never]?: EncoderType[EKey] extends OptionalType<infer OptionalValue extends keyof ValueTypes> ? ValueTypes[OptionalValue] | undefined : EncoderType[EKey] extends OptionalType<infer OptionalValue extends [keyof ValueTypes]> ? Array<ValueTypes[OptionalValue[0]]> | undefined : EncoderType[EKey] extends OptionalType<infer OptionalValue extends EncoderDefinition> ? InferredDecodedType<OptionalValue> | undefined : never;
};
export type InferredTransformConfig<EncoderType extends EncoderDefinition> = {
    [EKey in keyof EncoderType]?: EncoderType[EKey] extends keyof ValueTypes ? Transforms<ValueTypes[EncoderType[EKey]]> : EncoderType[EKey] extends [keyof ValueTypes] ? Transforms<ValueTypes[EncoderType[EKey][0]]> : EncoderType[EKey] extends EncoderDefinition ? InferredTransformConfig<EncoderType[EKey]> : EncoderType[EKey] extends [EncoderDefinition] ? InferredTransformConfig<EncoderType[EKey][number]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends keyof ValueTypes> ? Transforms<ValueTypes[OptionalValue]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends [keyof ValueTypes]> ? Transforms<ValueTypes[OptionalValue[0]]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends EncoderDefinition> ? InferredTransformConfig<OptionalValue> | undefined : never;
};
export type InferredValidationConfig<EncoderType extends EncoderDefinition> = {
    [EKey in keyof EncoderType]?: EncoderType[EKey] extends keyof ValueTypes ? ValidationFn<ValueTypes[EncoderType[EKey]]> : EncoderType[EKey] extends [keyof ValueTypes] ? ValidationFn<ValueTypes[EncoderType[EKey][0]]> : EncoderType[EKey] extends EncoderDefinition ? InferredValidationConfig<EncoderType[EKey]> : EncoderType[EKey] extends [EncoderDefinition] ? InferredValidationConfig<EncoderType[EKey][number]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends keyof ValueTypes> ? ValidationFn<ValueTypes[OptionalValue]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends [keyof ValueTypes]> ? ValidationFn<ValueTypes[OptionalValue[0]]> : EncoderType[EKey] extends OptionalType<infer OptionalValue extends EncoderDefinition> ? InferredValidationConfig<OptionalValue> | undefined : never;
};
/**
 * Binary coder types.
 */
export declare const enum Type {
    /**
     * A single boolean, encoded as 1 byte.
     *
     * To pack multiple booleans into a single byte, see:
     *
     * @see {Type.BooleanTuple}
     * @see {Type.Bitmask8}
     */
    Boolean = "bool",
    /** A string. */
    String = "str",
    /** Floating-point number (16-bit, half precision, 2 bytes). */
    Float16 = "float16",
    /** Floating-point number (32-bit, single precision, 4 bytes). */
    Float32 = "float32",
    /** Floating-point number (64-bit, double precision, 8 bytes). Default JavaScript `number` type. */
    Float64 = "float64",
    /**
     * Signed integer.
     *
     * Automatically uses 1, 2, 4, or 8 bytes depending on the value:
     *  - For values -64 -> 64 uses 1 byte.
     *  - For values -8,192 -> 8,192 uses 2 bytes.
     *  - For values -268,435,456 -> 268,435,456 uses 4 bytes.
     *  - For values -Number.MAX_SAFE_INTEGER -> Number.MAX_SAFE_INTEGER uses 8 bytes (if outside of the 4 byte range).
     */
    Int = "int",
    /** Signed 1 byte integer (between -127 and 127). */
    Int8 = "int8",
    /** Signed 2 byte integer (between -32,767 and 32,767). */
    Int16 = "int16",
    /** Signed 4 byte integer (between -2,147,483,647 and 2,147,483,647). */
    Int32 = "int32",
    /**
     * Unsigned integer.
     *
     * Automatically uses 1, 2, 4, or 8 bytes depending on the value:
     *  - For values 0 -> 127 uses 1 bytes.
     *  - For values 128 -> 16,384 uses 2 bytes.
     *  - For values 16,385 -> 536,870,911 uses 4 bytes.
     *  - For values 536,870,912 -> Number.MAX_SAFE_INTEGER uses 8 bytes.
     */
    UInt = "uint",
    /** Unsigned 1 byte integer (between 0 and 255). */
    UInt8 = "uint8",
    /** Unsigned 2 byte integer (between 0 and 65,535). */
    UInt16 = "uint16",
    /** Unsigned 4 byte integer (between 0 and 4,294,967,295). */
    UInt32 = "uint32",
    /** An unsigned scalar between 0.0 and 1.0. Stored as 1 byte. */
    UScalar = "uscalar",
    /** A signed scalar between -1.0 and 1.0. Stored as 1 byte. */
    Scalar = "scalar",
    /**
     * Any JavaScript ArrayBuffer.
     *
     * @see {ArrayBuffer}
     */
    Binary = "binary",
    /**
     * A JavaScript date object.
     *
     * Encoded as an 8 byte (64-bit) integer UTC timestamp from as the number
     * of milliseconds since the Unix Epoch (January 1, 1970, 00:00:00 UTC).
     *
     * @see {Date}
     */
    Date = "date",
    /**
     * A JavaScript regular expression.
     *
     * @see {RegExp}
     */
    RegExp = "regex",
    /**
     * Any JSON-serializable data.
     */
    JSON = "json",
    /**
     * A tuple/array of booleans.
     *
     * Automatically packs into the minimal amount of bytes (with a 2-bit header):
     *  - For arrays with 0 -> 6 values uses 1 bytes.
     *  - For arrays with 7 -> 12 values uses 2 bytes.
     *  - And so forth...
     */
    BooleanTuple = "booltuple",
    /** An array containing up to 8 booleans, encoded as a single UInt8. */
    Bitmask8 = "bitmask8",
    /** An array containing up to 16 booleans, encoded as a single UInt16. */
    Bitmask16 = "bitmask16",
    /** An array containing up to 32 booleans, encoded as a single UInt32. */
    Bitmask32 = "bitmask32",
    /** [INTERNAL ONLY] Use "[T]" array syntax instead. */
    Array = "[array]",
    /** [INTERNAL ONLY] Use "{}" object syntax instead. */
    Object = "{object}",
    /** Alias for `Type.Float16` @see {Float16} */
    Half = "float16",
    /** Alias for `Type.Float32` @see {Float32} */
    Single = "float32",
    /** Alias for `Type.Float64` @see {Float64} */
    Double = "float64",
    /** Alias for `Type.Float32` @see {Float32} */
    Float = "float32"
}
export declare const ValidValueTypes: readonly string[];
//# sourceMappingURL=Type.d.ts.map