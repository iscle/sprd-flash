'use client';

import SPRDDevice, { Packet } from "./lib/SPRDDevice";

export default function Home() {
  return (
    <button onClick={
      async () => {
        const sprd = new SPRDDevice();
        let success: boolean
        let packet: Packet
        
        success = await sprd.open();
        if (!success) {
          console.error('Error opening device')
          return
        }

        success = await sprd.sendHello();
        if (!success) {
          console.error('Error sending hello')
          return
        }

        packet = await sprd.receivePacket()
        console.debug('hello response:', packet.type.toString(16), packet.data)

        console.log('Device ready!')


      }
    }>
      Run!
    </button>
  );
}
