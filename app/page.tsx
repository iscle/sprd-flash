'use client';

import { ChangeEvent, MouseEventHandler, useState } from "react";
import SPRDDevice, { Packet } from "./lib/SPRDDevice";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Safely access the first file
    if (file) {
      setSelectedFile(file);
    }
  }

  const handleButtonClick = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    const sprd = new SPRDDevice();
        
    await sprd.open()

    const helloResponse = await sprd.sendHello();
    console.log('Hello response:', helloResponse)
    if (helloResponse !== 'SPRD3') {
      console.error('Received unknown response from bootrom')
      return
    }

    console.log('Device ready!')

    const stackLr = 0x3f58
    const loadAddr = 0x5500

    const readFileAsUint8Array = (file: File): Promise<Uint8Array> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            resolve(uint8Array);
          } else {
            reject(new Error("File reading failed"));
          }
        };
        reader.onerror = () => {
          reject(new Error("File reading error"));
        };
        reader.readAsArrayBuffer(file);
      });
    };

    const fileData = await readFileAsUint8Array(selectedFile);

    console.log(`Sending payload to ${loadAddr.toString(16)}... (${fileData.length} bytes)`);

    await sprd.sendPayload(0x5500, fileData);
    console.log('Payload sent!');
    await sprd.sendJumpToPayload(loadAddr + 0x200, stackLr, true);

    console.log('fdl1 hello:', await sprd.sendHello());
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleButtonClick}>
        Run!
      </button>
    </div>
  );
}
