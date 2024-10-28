enum HDLC_TYPE {
    CMD_CONNECT = 0x00,
    CMD_START_DATA = 0x01,
    CMD_MIDST_DATA = 0x02,
    CMD_END_DATA = 0x03,
    CMD_EXEC_DATA = 0x04,

    REP_ACK = 0x80,
    REP_VER = 0x81
}

export class Packet {
    readonly type: HDLC_TYPE
    readonly data: Uint8Array | undefined

    constructor(type: HDLC_TYPE, data: Uint8Array | undefined = undefined) {
        this.type = type
        this.data = data
    }
}

export default class SPRDDevice {
    private static HDLC_FLAG = 0x7e
    private static HDLC_ESCAPE = 0x7d
    private static HDLC_ESCAPE_MASK = 0x20
    private static HDLC_FRAME_MIN_SIZE = 8
    private static HDLC_FRAME_MAX_SIZE = SPRDDevice.HDLC_FRAME_MIN_SIZE + 0xFFFF

    private device?: USBDevice
    private config = -1
    private iface = -1
    private alt = -1
    private epIn = -1
    private epOut = -1

    private rcvBuf = new Uint8Array(SPRDDevice.HDLC_FRAME_MAX_SIZE)
    private rcvLen = 0

	async open(): Promise<boolean> {
        let device: USBDevice
        
        try {
            device = await navigator.usb.requestDevice({ filters: [{
                vendorId: 0x1782,
                productId: 0x4d00
            }]})
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotFoundError') {
                console.error('No device selected')
                return false
            }

            console.error('Error requesting device:', error)
            return false
        }

        if (!this.findConfigAndIface(device)) {
            console.error('No suitable configuration/interface found')
            return false
        }

        try {
            await device.open()
        } catch (error) {
            console.error('Error opening device:', error)
            return false
        }

        try {
            await device.selectConfiguration(this.config)
        } catch (error) {
            console.error('Error selecting configuration:', error)
            await device.close()
            return false
        }

        try {
            await device.claimInterface(this.iface)
        } catch (error) {
            console.error('Error claiming interface:', error)
            await device.close()
            return false
        }

        try {
            await device.selectAlternateInterface(this.iface, this.alt)
        } catch (error) {
            console.error('Error selecting alternate interface:', error)
            await device.close()
            return false
        }

        this.device = device

        return true
    }

    async sendHello(): Promise<string> {
        const data = new Uint8Array([SPRDDevice.HDLC_FLAG])
        await this.transferOut(data)
        const response = await this.receivePacket()
        if (response.type !== HDLC_TYPE.REP_VER) throw Error()
        if (response.data === undefined) throw Error()
        return new TextDecoder('utf-8').decode(response.data.slice(0, response.data.byteLength - 1))
    }

    async sendConnect(): Promise<boolean> {
        if (!await this.sendPacket(new Packet(HDLC_TYPE.CMD_CONNECT))) throw Error()
        await this.receiveAck()
        return true
    }

    async sendStartData(address: number, length: number): Promise<boolean> {
        const buffer = new ArrayBuffer(8)
        const view = new DataView(buffer)
        const array = new Uint8Array(buffer)

        view.setUint32(0, address)
        view.setUint32(4, length)

        if (!await this.sendPacket(new Packet(HDLC_TYPE.CMD_START_DATA, array))) throw Error()
        await this.receiveAck()
        return true
    }

    async sendMidstData(data: Uint8Array): Promise<boolean> {
        if (!await this.sendPacket(new Packet(HDLC_TYPE.CMD_MIDST_DATA, data))) throw Error()
        await this.receiveAck()
        return true
    }

    async sendEndData(): Promise<boolean> {
        if (!await this.sendPacket(new Packet(HDLC_TYPE.CMD_END_DATA))) throw Error()
        await this.receiveAck()
        return true
    }

    private async receiveAck() {
        const response = await this.receivePacket()
        if (response.type !== HDLC_TYPE.REP_ACK) throw Error()
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
        const buffer = new ArrayBuffer(SPRDDevice.HDLC_FRAME_MAX_SIZE)
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
            if (this.rcvLen === 0 && !await this.transferIn()) {
                throw Error('Failed to transferIn')
            }

            console.debug('rcvBuf:', Array.prototype.map.call(
                this.rcvBuf.slice(0, this.rcvLen),
                x => ('00' + x.toString(16)).slice(-2)
            ).join(''))

            let i = 0
            while (i < this.rcvLen) {
                const b = this.rcvBuf[i++]
                switch (state) {
                    case PACKET_STATE.START: {
                        if (b === SPRDDevice.HDLC_FLAG) {
                            state = PACKET_STATE.UNESCAPED
                        }
                        break
                    }
                    case PACKET_STATE.ESCAPED: {
                        array[arrayPos++] = b ^ SPRDDevice.HDLC_ESCAPE_MASK
                        state = PACKET_STATE.UNESCAPED
                        break
                    }
                    case PACKET_STATE.UNESCAPED: {
                        switch (b) {
                            case SPRDDevice.HDLC_FLAG: {
                                state = PACKET_STATE.END
                                break
                            }
                            case SPRDDevice.HDLC_ESCAPE: {
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

            this.rcvBuf.set(this.rcvBuf.slice(i, this.rcvLen))
            this.rcvLen -= i
        } while (state !== PACKET_STATE.END)

        const type = view.getUint16(0)
        const dataLength = view.getUint16(2)

        return new Packet(
            type,
            new Uint8Array(buffer, 4, dataLength)
        )
    }

    private async sendPacket(packet: Packet): Promise<boolean> {
        const dataLength = packet.data ? packet.data.byteLength : 0
        /* Double the length to account for escaped bytes */
        const buffer = new ArrayBuffer(SPRDDevice.HDLC_FRAME_MIN_SIZE + dataLength * 2)
        const view = new DataView(buffer)
        const array = new Uint8Array(buffer)

        view.setUint8(0, SPRDDevice.HDLC_FLAG)
        view.setUint16(1, packet.type)
        view.setUint16(3, dataLength)
        if (packet.data) array.set(packet.data, 5)
        const crc = this.bromCrc(array, 1, 4 + dataLength)
        view.setUint16(5 + dataLength, crc)
        view.setUint8(7 + dataLength, SPRDDevice.HDLC_FLAG)
        
        /* Escape HDCL_FLAG and HDLC_ESCAPE bytes */
        let i = 0
        let j = 0
        
        array[j++] = array[i++] /* HDLC_FLAG */
        for (; i < SPRDDevice.HDLC_FRAME_MIN_SIZE - 2 + dataLength; i++) {
            const b = array[i]
            if (b === SPRDDevice.HDLC_FLAG || b === SPRDDevice.HDLC_ESCAPE) {
                array[j++] = SPRDDevice.HDLC_ESCAPE
                array[j++] = b ^ SPRDDevice.HDLC_ESCAPE_MASK
            } else {
                array[j++] = b
            }
        }
        array[j++] = array[i++] /* HDLC_FLAG */

        await this.transferOut(buffer.slice(0, j))

        return true
    }

    private bromCrc(array: Uint8Array, offset: number, length: number): number {
        const CRC_16_L_SEED: number = 0x80
        const CRC_16_L_POLYNOMIAL: number = 0x8000
        const CRC_16_POLYNOMIAL: number = 0x1021

        let crc: number = 0

        for (let i = offset; i < offset + length; i++) {
            for (let j = CRC_16_L_SEED; j !== 0; j >>= 1) {
                if ((crc & CRC_16_L_POLYNOMIAL) !== 0) {
                    crc <<= 1
                    crc ^= CRC_16_POLYNOMIAL
                } else {
                    crc <<= 1
                }

                if ((array[i] & j) !== 0) {
                    crc ^= CRC_16_POLYNOMIAL
                }
            }
        }

        return crc
    }

    private async transferIn(): Promise<boolean> {
        if (!this.device) {
            console.error('Device not open')
            return false
        }

        let result: USBInTransferResult

        try {
            result = await this.device.transferIn(this.epIn, this.rcvBuf.byteLength - this.rcvLen)
        } catch (error) {
            console.error('Error receiving data:', error)
            return false
        }

        if (result.status === 'ok') {
            if (result.data) {
                const array = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength)
                this.rcvBuf.set(array, this.rcvLen)
                this.rcvLen += array.byteLength
            }
            return true
        } else {
            return false
        }
    }

    private async transferOut(data: BufferSource) {
        if (!this.device) {
            throw Error('Device not open')
        }

        const result = await this.device.transferOut(this.epOut, data)    
        return result.status === 'ok' && result.bytesWritten === data.byteLength
    }

    private async findConfigAndIface(device: USBDevice): Promise<boolean> {
        for (const config of device.configurations) {
            for (const iface of config.interfaces) {
                for (const alt of iface.alternates) {
                    if (alt.interfaceClass === 0xff && alt.endpoints.length === 2) {
                        this.config = config.configurationValue
                        this.iface = iface.interfaceNumber
                        this.alt = alt.alternateSetting
                        for (const ep of alt.endpoints) {
                            if (ep.direction === 'in') {
                                this.epIn = ep.endpointNumber
                            } else if (ep.direction === 'out') {
                                this.epOut = ep.endpointNumber
                            }
                        }
                        console.log('Configuration:', config)
                        console.log('Interface:', iface)
                        return true
                    }
                }
            }
        }
        return false
    }
}