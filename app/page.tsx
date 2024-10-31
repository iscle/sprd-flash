'use client';

import { ChangeEvent, MouseEventHandler, useState } from "react";
import SPRDDevice, { Packet } from "./lib/SPRDDevice";
import BootROM from "./lib/BootROM";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Safely access the first file
    if (file) {
      setSelectedFile(file);
    }
  }

  function delay(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleButtonClick = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    const sprd = new SPRDDevice();
    await sprd.open()

    const bootRom = new BootROM(sprd);

    const helloResponse = await bootRom.sendHello();
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

    await bootRom.sendPayload(loadAddr, fileData);
    console.log('Payload sent!');
    await bootRom.sendJumpToPayload(stackLr, loadAddr + 0x200, true);

    await delay(1000)

    console.log('fdl1 hello:', await bootRom.sendHello());
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
