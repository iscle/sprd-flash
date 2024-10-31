export enum SPRDFamily {
    IWHALE2,
    ISHARKL2,
    SHARKLJ1,
    SHARKLE,
    PIKE2,
    SHARKL3,
    SHARKL5,
    SHARKL5PRO,
    ROC1,
}

export default class SPRDDevice {
    readonly family: SPRDFamily
    private device?: USBDevice
    private config = -1
    private iface = -1
    private alt = -1
    private epIn = -1
    private epOut = -1

    constructor(family: SPRDFamily) {
        this.family = family
    }

	async open() {
        const device = await navigator.usb.requestDevice({ filters: [{
            vendorId: 0x1782,
            productId: 0x4d00
        }]})

        await this.findConfigAndIface(device)
        await device.open()
        await device.selectConfiguration(this.config)
        await device.claimInterface(this.iface)
        await device.selectAlternateInterface(this.iface, this.alt)

        this.device = device

        return true
    }

    async transferIn(length: number): Promise<Uint8Array> {
        if (!this.device) {
            throw Error('Device not open')
        }

        const result = await this.device.transferIn(this.epIn, length)

        console.debug('Received data:', result)

        if (result.status !== 'ok' || !result.data) {
            throw Error('Failed to receive data')
        }

        return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength)
    }

    async transferOut(data: Uint8Array) {
        if (!this.device) {
            throw Error('Device not open')
        }

        console.debug('Sending data:', Array.prototype.map.call(
            data,
            x => ('00' + x.toString(16)).slice(-2)
        ).join(''))

        const result = await this.device.transferOut(this.epOut, data)  

        if (result.status !== 'ok' || result.bytesWritten !== data.byteLength) {
            throw Error('Failed to send data')
        }
    }

    private async findConfigAndIface(device: USBDevice) {
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
                        console.debug('Configuration:', config)
                        console.debug('Interface:', iface)
                        return
                    }
                }
            }
        }
        throw Error('No suitable configuration/interface found')
    }
}