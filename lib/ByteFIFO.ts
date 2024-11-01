export default class ByteFIFO {
    private buffer: Uint8Array;
    private tail = 0; // Points to the end of data
    readonly length: number;
  
    constructor(maxLength: number) {
      this.length = maxLength;
      this.buffer = new Uint8Array(maxLength);
    }
  
    // Append data to the buffer if there’s room
    append(data: Uint8Array) {
      if (this.tail + data.length > this.length) {
        throw new Error("Buffer overflow");
      }
      this.buffer.set(data, this.tail);
      this.tail += data.length;
    }
  
    // Peek at a specified length without consuming
    peek(length: number): Uint8Array {
      if (length > this.tail) {
        throw new Error("Not enough data");
      }
      return this.buffer.subarray(0, length);
    }
  
    // Consume bytes from the start of the buffer
    consume(length: number) {
      if (length > this.tail) {
        throw new Error("Not enough data");
      }
      this.buffer.copyWithin(0, length, this.tail);
      this.tail -= length;
    }

    get(length: number): Uint8Array {
        const data = this.peek(length);
        this.consume(length);
        return data;
    }
  
    // Get the number of bytes available for reading
    get available(): number {
      return this.tail;
    }

    get free(): number {
        return this.length - this.tail;
    }
  }
  