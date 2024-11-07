'use client'

import { BaseTool } from '@/component/BaseTool';
import GuidedDownload from '@/component/GuidedDownload';
import Typography from '@mui/material/Typography';

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export default function DumpEmmc() {
  return <BaseTool title="Dump EMMC">
    <GuidedDownload
      successContent={
        <Typography variant="body1">Connect to device succeeded! Typically, we would have a button or something here to proceed.</Typography>
      }
      onWaitForDevice={async () => {
        await timeout(5000);
        return false;
      }}
    />
  </BaseTool>
}