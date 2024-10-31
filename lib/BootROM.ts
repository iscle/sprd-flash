import ByteFIFO from "./ByteFiFO"
import SPRDDevice from "./SPRDDevice"

const HDLC_FLAG = 0x7e
const HDLC_ESCAPE = 0x7d
const HDLC_ESCAPE_MASK = 0x20
const HDLC_DATA_MAX_SIZE = 512
const HDLC_FRAME_MIN_SIZE = 8
const HDLC_FRAME_MAX_SIZE = HDLC_FRAME_MIN_SIZE + HDLC_DATA_MAX_SIZE

enum CMD {
    REQ_CONNECT = 0x00,
    REQ_START_DATA = 0x01,
    REQ_MIDST_DATA = 0x02,
    REQ_END_DATA = 0x03,
    REQ_EXEC_DATA = 0x04,

    REP_ACK = 0x80,
    REP_VER = 0x81
}

export class Packet {
    readonly type: CMD
    readonly data: Uint8Array | undefined

    constructor(type: CMD, data: Uint8Array | undefined = undefined) {
        this.type = type
        this.data = data
    }
}

export default class BootROM {
    private device: SPRDDevice
    private inFifo = new ByteFIFO(HDLC_FRAME_MAX_SIZE)

    constructor(device: SPRDDevice) {
        this.device = device
    }

    async sendHello(): Promise<string> {
        const data = new Uint8Array([HDLC_FLAG])
        await this.device.transferOut(data)
        const response = await this.receivePacket()
        if (response.type !== CMD.REP_VER) throw Error()
        if (response.data === undefined) throw Error()
        return new TextDecoder('utf-8').decode(response.data.slice(0, response.data.byteLength - 1))
    }

    async sendConnect() {
        await this.sendPacket(new Packet(CMD.REQ_CONNECT))
        await this.receiveAck()
    }

    async sendStartData(address: number, length: number) {
        const buffer = new ArrayBuffer(8)
        const view = new DataView(buffer)
        const array = new Uint8Array(buffer)

        view.setUint32(0, address)
        view.setUint32(4, length)

        await this.sendPacket(new Packet(CMD.REQ_START_DATA, array))
        await this.receiveAck()
    }

    async sendMidstData(data: Uint8Array) {
        await this.sendPacket(new Packet(CMD.REQ_MIDST_DATA, data))
        await this.receiveAck()
    }

    async sendEndData() {
        await this.sendPacket(new Packet(CMD.REQ_END_DATA))
        await this.receiveAck()
    }

    async sendPayload(address: number, data: Uint8Array) {
        await this.sendStartData(address, data.byteLength)
        const chunkSize = HDLC_DATA_MAX_SIZE
        for (let i = 0; i < data.byteLength; i += chunkSize) {
            await this.sendMidstData(data.slice(i, i + chunkSize))
        }
        await this.sendEndData()
    }

    /*
     * Jumps to the specified address by overwritting a specific lr value in the stack.
     */
    async sendJumpToPayload(stackLr: number, address: number, is64bit: boolean) {
        await this.sendStartData(stackLr, 8)

        const buffer = new ArrayBuffer(is64bit ? 8 : 4)
        const view = new DataView(buffer)
        const array = new Uint8Array(buffer)

        view.setUint32(0, address, true)
        if (is64bit) view.setUint32(4, 0, true)

        await this.sendMidstData(array)
    }

    private async receiveAck() {
        const response = await this.receivePacket()
        if (response.type !== CMD.REP_ACK) throw Error('Received unexpected response')
    }

    /*
     * HDLC frame format:
     *
     * HDLC_FLAG (1 byte)
     * Type (2 bytes)
     * Length (2 bytes)
     * Data (Length bytes)
     * CRC (2 bytes)
     * HDLC_FLAG (1 byte)
     */

    async receivePacket(): Promise<Packet> {
        const buffer = new ArrayBuffer(HDLC_FRAME_MAX_SIZE)
        const array = new Uint8Array(buffer)
        const view = new DataView(buffer)
        let arrayPos = 0

        enum PACKET_STATE {
            START,
            UNESCAPED,
            ESCAPED,
            END,
        };
        let state = PACKET_STATE.START

        do {
            if (this.inFifo.available === 0) {
                try {
                    const data = await this.device.transferIn(this.inFifo.free)
                    this.inFifo.append(data)
                } catch (error) {
                    console.warn('Failed to receive data:', error)
                    continue
                }
            }

            const data = this.inFifo.peek(this.inFifo.available)
            let i = 0;
            while (i < data.byteLength && state !== PACKET_STATE.END) {
                const b = data[i++]
                switch (state) {
                    case PACKET_STATE.START: {
                        if (b === HDLC_FLAG) {
                            state = PACKET_STATE.UNESCAPED
                        }
                        break
                    }
                    case PACKET_STATE.ESCAPED: {
                        array[arrayPos++] = b ^ HDLC_ESCAPE_MASK
                        state = PACKET_STATE.UNESCAPED
                        break
                    }
                    case PACKET_STATE.UNESCAPED: {
                        switch (b) {
                            case HDLC_FLAG: {
                                state = PACKET_STATE.END
                                break
                            }
                            case HDLC_ESCAPE: {
                                state = PACKET_STATE.ESCAPED
                                break
                            }
                            default: {
                                array[arrayPos++] = b
                                break
                            }
                        }
                    }
                }
            }

            this.inFifo.consume(i)
        } while (state !== PACKET_STATE.END)

        const type = view.getUint16(0)
        const dataLength = view.getUint16(2)
        const data = dataLength > 0 ? new Uint8Array(buffer, 4, dataLength) : undefined
        const crc = view.getUint16(4 + dataLength)
        const expectedCrc = this.crc(array, 0, 4 + dataLength)
        if (crc !== expectedCrc) throw Error(`CRC mismatch: expected ${expectedCrc}, got ${crc}`)

        return new Packet(
            type,
            data
        )
    }

    private async sendPacket(packet: Packet) {
        const dataLength = packet.data ? packet.data.byteLength : 0
        const buffer = new ArrayBuffer(HDLC_FRAME_MIN_SIZE * 2 + dataLength * 2)
        const view = new DataView(buffer)
        const array = new Uint8Array(buffer)

        view.setUint8(0, HDLC_FLAG)
        view.setUint16(1, packet.type)
        view.setUint16(3, dataLength)
        if (packet.data) array.set(packet.data, 5)
        const crc = this.crc(array, 1, 4 + dataLength)
        view.setUint16(5 + dataLength, crc)
        view.setUint8(7 + dataLength, HDLC_FLAG)
        
        /* Escape HDCL_FLAG and HDLC_ESCAPE bytes */
        let i = HDLC_FRAME_MIN_SIZE + dataLength - 1
        let j = array.byteLength - 1

        array[j--] = array[i--] /* HDLC_FLAG */
        for (; i > 0; i--) {
            const b = array[i]
            if (b === HDLC_FLAG || b === HDLC_ESCAPE) {
                array[j--] = b ^ HDLC_ESCAPE_MASK
                array[j--] = HDLC_ESCAPE
            } else {
                array[j--] = b
            }
        }
        array[j] = array[i] /* HDLC_FLAG */

        await this.device.transferOut(array.slice(j, buffer.byteLength))
    }


    private crc(data: Uint8Array, offset: number, length: number): number {
        const CRC_16_L_SEED: number = 0x80
        const CRC_16_L_POLYNOMIAL: number = 0x8000
        const CRC_16_POLYNOMIAL: number = 0x1021

        let crc: number = 0

        for (let i = offset; i < offset + length; i++) {
            for (let j = CRC_16_L_SEED; j !== 0; j >>= 1) {
                if ((crc & CRC_16_L_POLYNOMIAL) !== 0) {
                    crc <<= 1
                    crc ^= CRC_16_POLYNOMIAL
                    crc &= 0xFFFF
                } else {
                    crc <<= 1
                    crc &= 0xFFFF
                }

                if ((data[i] & j) !== 0) {
                    crc ^= CRC_16_POLYNOMIAL
                }
            }
        }

        return crc
    }
}