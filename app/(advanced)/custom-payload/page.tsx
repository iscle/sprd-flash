'use client';

import BootROM from "@/lib/BootROM";
import { ChangeEvent, useState } from "react";
import SPRDDevice, { SPRDFamily } from "@/lib/SPRDDevice";
import { Button, Input } from "@mui/material";
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import { readFile } from "@/lib/util";
import Socrates from "@/lib/Socrates";
import { BaseTool } from "@/component/BaseTool";

export default function CustomPayload() {
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

    /* Open a SHARKL5PRO device */
    const sprd = new SPRDDevice(SPRDFamily.SHARKL5PRO);

    await sprd.open()

    /* Load the payload using the BootROM */
    const bootRom = new BootROM(sprd);

    await sprd.controlTransferOut();

    const helloResponse = await bootRom.sendHello();
    console.log('Hello response:', helloResponse)
    if (helloResponse !== 'SPRD3') {
      console.error('Received unknown response from bootrom')
      return
    }

    console.log('Device ready!')

    const loadAddr = 0x5500;
    const fileData = await readFile(selectedFile);

    console.log(`Sending payload to ${loadAddr.toString(16)}... (${fileData.length} bytes)`);
    await bootRom.sendPayload(loadAddr, fileData);
    console.log('Jumping to payload...');
    await bootRom.sendJumpToPayload(loadAddr + 0x200);
  }

  return (
    <BaseTool title="Custom payload">
      <FormControl>
        <FormLabel htmlFor="payload">Payload</FormLabel>
        <Input
          id="payload"
          fullWidth
          disableUnderline
          required
          color={'primary'}
          type="file"
          sx={{ ariaLabel: 'payload' }}
          onChange={handleFileChange} />
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        disabled={!selectedFile}
        onClick={handleButtonClick}
      >
        Run!
      </Button>
    </BaseTool>
  );
}