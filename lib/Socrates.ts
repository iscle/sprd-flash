import ByteFIFO from "./ByteFIFO";
import SPRDDevice from "./SPRDDevice";

enum CMD {
  REQ_VERSION = 0x0000 /* 0x0000 */,

  /* Registers */
  REQ_READ_REG8 /* 0x0001 */,
  REQ_WRITE_REG8 /* 0x0002 */,
  REQ_READ_REG16 /* 0x0003 */,
  REQ_WRITE_REG16 /* 0x0004 */,
  REQ_READ_REG32 /* 0x0005 */,
  REQ_WRITE_REG32 /* 0x0006 */,
  REQ_READ_REG64 /* 0x0007 */,
  REQ_WRITE_REG64 /* 0x0008 */,

  /* MMC */
  REQ_MMC_INIT /* 0x0009 */,
  REQ_MMC_SWITCH /* 0x000a */,
  REQ_MMC_GET_SEC_COUNT /* 0x000b */,
  REQ_MMC_READ_SINGLE_BLOCK /* 0x000c */,
  REQ_MMC_WRITE_BLOCK /* 0x000d */,

  RSP_OK = 0x8000 /* 0x8000 */,
  RSP_ERROR /* 0x8001 */,

  /* Registers */
  RSP_READ_REG8 /* 0x8002 */,
  RSP_READ_REG16 /* 0x8003 */,
  RSP_READ_REG32 /* 0x8004 */,
  RSP_READ_REG64 /* 0x8005 */,

  /* MMC */
  RSP_MMC_GET_SEC_COUNT /* 0x8006 */,
  RSQ_MMC_READ_SINGLE_BLOCK /* 0x8007 */,
}

export class Packet {
  readonly type: CMD;
  readonly data: Uint8Array | undefined;

  constructor(type: CMD, data: Uint8Array | undefined = undefined) {
    this.type = type;
    this.data = data;
  }
}

export default class Socrates {
  private device: SPRDDevice;
  private inFifo = new ByteFIFO(1024);

  constructor(device: SPRDDevice) {
    this.device = device;
  }

  /*
   * Socrates packet structure
   * type: 2 bytes
   * length: 2 bytes
   * data: length bytes
   */

  async receivePacket(timeout: number = 1000): Promise<Packet> {
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

  async sendPacket(packet: Packet) {
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
