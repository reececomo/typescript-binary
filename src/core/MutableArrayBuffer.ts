import { toFloat16 } from "./lib/float16";

/**
 * A mutable-length write-only array buffer.
 *
 * If you use beyond the byte limit of the underlying buffer, it will be dynamically resized.
 */
export class MutableArrayBuffer {
  private _dataView: DataView;
  private _length: number = 0;

  public constructor(initialBytes: number = 256, private maxAutoResizeIncrementBytes = 1024) {
    const arrayBuffer = new ArrayBuffer(initialBytes);
    this._dataView = new DataView(arrayBuffer);
  }

  // ----- Getters: -----

  /** The amount of bytes currently available to the underlying memory. */
  public get currentAllocatedBytes(): number {
    return this._dataView.byteLength;
  }

  // ----- Methods: -----

  /**
   * Return the data as a correctly-sized array buffer.
   *
   * Note: The returned buffer and the internal buffer share the same memory
   */
  public toArrayBuffer(): ArrayBuffer {
    return this._dataView.buffer.slice(0, this._length);
  }

  // ----- Writers: -----
  /* eslint-disable disable-autofix/jsdoc/require-jsdoc */

  public appendBuffer(data: ArrayBuffer): void {
    const dataView = new Uint8Array(data);

    this._alloc(dataView.byteLength);
    for (let i = 0; i < data.byteLength; i++) {
      this._dataView.setUint8(this._length + i, dataView[i]);
    }
    this._length += data.byteLength;
  }

  public writeInt8(value: number): void {
    this._alloc(1);
    this._dataView.setInt8(this._length, value);
    this._length++;
  }

  public writeInt16(value: number): void {
    this._alloc(2);
    this._dataView.setInt16(this._length, value, true);
    this._length += 2;
  }

  public writeInt32(value: number): void {
    this._alloc(4);
    this._dataView.setInt32(this._length, value, true);
    this._length += 4;
  }

  public writeUInt8(value: number): void {
    this._alloc(1);
    this._dataView.setUint8(this._length, value);
    this._length++;
  }

  public writeUInt16(value: number): void {
    this._alloc(2);
    this._dataView.setUint16(this._length, value);
    this._length += 2;
  }

  public writeUInt32(value: number): void {
    this._alloc(4);
    this._dataView.setUint32(this._length, value);
    this._length += 4;
  }

  public writeFloat16(value: number): void {
    this._alloc(2);
    this._dataView.setUint16(this._length, toFloat16(value));
    this._length += 2;
  }

  public writeFloat32(value: number): void {
    this._alloc(4);
    this._dataView.setFloat32(this._length, value);
    this._length += 4;
  }

  public writeFloat64(value: number): void {
    this._alloc(8);
    this._dataView.setFloat64(this._length, value);
    this._length += 8;
  }
  /* eslint-enable disable-autofix/jsdoc/require-jsdoc */

  // ----- Private methods: -----

  /** Alloc the given number of bytes (if needed). */
  private _alloc(bytes: number): void {
    const currentDataViewLength = this._dataView.byteLength;

    if (this._length + bytes <= currentDataViewLength) {
      return;
    }

    let newBufferLength = this._dataView.byteLength;
    do {
      // Extend the length of the buffer until we're above the limit.
      newBufferLength += Math.min(newBufferLength, this.maxAutoResizeIncrementBytes);
    } while (this._length + bytes > newBufferLength);

    // Copy
    const newArrayBuffer = new ArrayBuffer(newBufferLength);
    const newDataView = new DataView(newArrayBuffer);
    for (let i = 0; i < currentDataViewLength; i++) {
      const value = this._dataView.getUint8(i);
      newDataView.setUint8(i, value);
    }

    this._dataView = newDataView;
  }
}

export default MutableArrayBuffer;
