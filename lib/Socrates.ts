import ByteFIFO from "./ByteFIFO";
import SPRDDevice from "./SPRDDevice";

enum CMD {
  REQ_VERSION = 0x0000      /* 0x0000 */,

  /* Registers */
  REQ_READ_8                /* 0x0001 */,
  REQ_WRITE_8               /* 0x0002 */,
  REQ_READ_16               /* 0x0003 */,
  REQ_WRITE_16              /* 0x0004 */,
  REQ_READ_32               /* 0x0005 */,
  REQ_WRITE_32              /* 0x0006 */,
  REQ_READ_64               /* 0x0007 */,
  REQ_WRITE_64              /* 0x0008 */,

  /* MMC */
  REQ_MMC_INIT              /* 0x0009 */,
  REQ_MMC_SWITCH            /* 0x000a */,
  REQ_MMC_GET_SEC_COUNT     /* 0x000b */,
  REQ_MMC_READ_SINGLE_BLOCK /* 0x000c */,
  REQ_MMC_WRITE_BLOCK       /* 0x000d */,

  RSP_OK = 0x8000           /* 0x8000 */,
  RSP_ERROR                 /* 0x8001 */,

  RSP_VERSION               /* 0x8002 */,

  /* Registers */
  RSP_READ_8                /* 0x8003 */,
  RSP_READ_16               /* 0x8004 */,
  RSP_READ_32               /* 0x8005 */,
  RSP_READ_64               /* 0x8006 */,

  /* MMC */
  RSP_MMC_GET_SEC_COUNT     /* 0x8007 */,
  RSP_MMC_READ_SINGLE_BLOCK /* 0x8008 */,
}

class Packet {
  readonly type: CMD;
  readonly data: Uint8Array | undefined;

  constructor(type: CMD, data: Uint8Array | undefined = undefined) {
    this.type = type;
    this.data = data;
  }
}

export class Version {
  readonly name: string;
  readonly number: number;

  constructor(name: string, number: number) {
    this.name = name;
    this.number = number;
  }
}

export default class Socrates {
  private device: SPRDDevice;
  private inFifo = new ByteFIFO(1024);

  constructor(device: SPRDDevice) {
    this.device = device;
  }

  async version(): Promise<Version> {
    await this.sendPacket(new Packet(CMD.REQ_VERSION));
    const response = await this.receivePacket();

    if (response.type !== CMD.RSP_OK) throw Error();
    if (response.data === undefined) throw Error();
    if (response.data.byteLength < 2) throw Error();
    
    const nameEnd = response.data.indexOf(0);
    if (nameEnd < 0) throw Error();
    
    const name = new TextDecoder("utf-8").decode(response.data.slice(0, nameEnd));
    const number = response.data[nameEnd + 1];
    return new Version(name, number);
  }

  async read8(address: bigint): Promise<number> {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);

    await this.sendPacket(new Packet(CMD.REQ_READ_8, array));
    const response = await this.receivePacket();
    if (response.type !== CMD.RSP_READ_8) throw Error();
    if (response.data === undefined) throw Error();
    if (response.data.byteLength !== 1) throw Error();
    return response.data[0];
  }

  async write8(address: bigint, value: number) {
    const array = new Uint8Array(9);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);
    view.setUint8(8, value);

    await this.sendPacket(new Packet(CMD.REQ_WRITE_8, array));
    await this.receiveAck();
  }

  async read16(address: bigint): Promise<number> {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);

    await this.sendPacket(new Packet(CMD.REQ_READ_16, array));
    const response = await this.receivePacket();
    if (response.type !== CMD.RSP_READ_16) throw Error();
    if (response.data === undefined) throw Error();
    if (response.data.byteLength !== 2) throw Error();
    return new DataView(response.data.buffer).getUint16(0);
  }

  async write16(address: bigint, value: number) {
    const array = new Uint8Array(10);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);
    view.setUint16(8, value);

    await this.sendPacket(new Packet(CMD.REQ_WRITE_16, array));
    await this.receiveAck();
  }

  async read32(address: bigint): Promise<number> {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);

    await this.sendPacket(new Packet(CMD.REQ_READ_32, array));
    const response = await this.receivePacket();
    if (response.type !== CMD.RSP_READ_32) throw Error();
    if (response.data === undefined) throw Error();
    if (response.data.byteLength !== 4) throw Error();
    return new DataView(response.data.buffer).getUint32(0);
  }

  async write32(address: bigint, value: number) {
    const array = new Uint8Array(12);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);
    view.setUint32(8, value);

    await this.sendPacket(new Packet(CMD.REQ_WRITE_32, array));
    await this.receiveAck();
  }

  async read64(address: bigint): Promise<bigint> {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);

    await this.sendPacket(new Packet(CMD.REQ_READ_64, array));
    const response = await this.receivePacket();
    if (response.type !== CMD.RSP_READ_64) throw Error();
    if (response.data === undefined) throw Error();
    if (response.data.byteLength !== 8) throw Error();
    return new DataView(response.data.buffer).getBigUint64(0);
  }

  async write64(address: bigint, value: bigint) {
    const array = new Uint8Array(16);
    const view = new DataView(array.buffer);

    view.setBigUint64(0, address);
    view.setBigUint64(8, value);

    await this.sendPacket(new Packet(CMD.REQ_WRITE_64, array));
    await this.receiveAck();
  }

  private async receiveAck() {
    const response = await this.receivePacket();
    if (response.type !== CMD.RSP_OK) throw Error();
  }

  /*
   * Socrates packet structure
   * type: 2 bytes
   * length: 2 bytes
   * data: length bytes
   */

  private async receivePacket(timeout: number = 1000): Promise<Packet> {
    let array: Uint8Array;
    let view: DataView;
    let dataLength: number = 0;

    while (true) {
      while (this.inFifo.available < 4 + dataLength) {
        try {
          const data = await this.device.transferIn(this.inFifo.free, timeout);
          this.inFifo.append(data);
        } catch (error) {
          // TODO: Maybe retry?
          throw error;
        }
      }

      array = this.inFifo.peek(4);
      view = new DataView(array.buffer);
      dataLength = view.getUint16(2);

      if (this.inFifo.available >= 4 + dataLength) {
        array = this.inFifo.get(4 + dataLength);
        view = new DataView(array.buffer);
        break;
      }
    }

    const type = view.getUint16(0);
    const data = dataLength > 0 ? array.subarray(4, 4 + dataLength) : undefined;

    return new Packet(type, data);
  }

  private async sendPacket(packet: Packet) {
    const dataLength = packet.data ? packet.data.byteLength : 0;
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);
    const array = new Uint8Array(buffer);

    view.setUint16(0, packet.type);
    view.setUint16(2, dataLength);
    if (packet.data) array.set(packet.data, 4);

    await this.device.transferOut(array.slice(0, 4 + dataLength));
  }
}
