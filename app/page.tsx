'use client';

import SPRDDevice, { Packet } from "./lib/SPRDDevice";

export default function Home() {
  return (
    <button onClick={
      async () => {
        const sprd = new SPRDDevice();
        
        if (!await sprd.open()) {
          console.error('Error opening device')
          return
        }

        const helloResponse = await sprd.sendHello();
        console.debug('Hello response:', helloResponse)
        if (helloResponse !== 'SPRD3') {
          console.error('Received unknown response from bootrom')
          return
        }

        console.log('Device ready!')



      }
    }>
      Run!
    </button>
  );
}
