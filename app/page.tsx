'use client';

import BootROM from "./lib/BootROM";
import { ChangeEvent, useState } from "react";
import SPRDDevice, { SPRDFamily } from "./lib/SPRDDevice";
import { Button, Input } from "@mui/material";
import Box from '@mui/material/Box';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { readFile } from "./lib/util";
import Socrates from "./lib/Socrates";

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

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

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

    /* Open a SHARKL5PRO device */
    const sprd = new SPRDDevice(SPRDFamily.SHARKL5PRO);
    await sprd.open()

    /* Load the payload using the BootROM */
    const bootRom = new BootROM(sprd);

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

    const socrates = new Socrates(sprd);

    
  }

  return (
    <SignInContainer direction="column" justifyContent="space-between">
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
            onClick={handleButtonClick}
          >
            Run!
          </Button>
        </Box>
      </Card>
    </SignInContainer>
  );
}
