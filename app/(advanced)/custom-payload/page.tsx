'use client';

import BootROM from "@/lib/BootROM";
import { ChangeEvent, useState } from "react";
import SPRDDevice, { SPRDFamily } from "@/lib/SPRDDevice";
import { Button, Input } from "@mui/material";
import Box from '@mui/material/Box';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { readFile } from "@/lib/util";
import Socrates from "@/lib/Socrates";
import { StyledBaseScreen } from "@/component/BaseScreen";

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

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
    const socrates = new Socrates(sprd);

    try {
      const version = socrates.version();
      console.log('Version:', version);

      return
    } catch (e) {
      void (e)
      console.log('Not in Socrates mode');
    }

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
    <StyledBaseScreen direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <Box
          component="form"
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
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
        </Box>
      </Card>
    </StyledBaseScreen>
  );
}