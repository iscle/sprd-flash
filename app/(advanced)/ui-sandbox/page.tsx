'use client'
import GuidedDownload from "@/component/GuidedDownload";
import { Divider, Typography } from "@mui/material";

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export default function UiSandbox() {
  return (
    <div className="p-4">
      <Typography variant="h4" component="div">Guided Download</Typography>

      <Divider />

      <div className="p-4">
        <Typography variant="h5" component="div">Succeeds after 5s</Typography>

        <GuidedDownload onWaitForDevice={async () => {
          await timeout(5000);
          return true;
        }} />
      </div>

      <Divider />

      <div className="p-4">
        <Typography variant="h5" component="div">Fails after 5s</Typography>

        <GuidedDownload onWaitForDevice={async () => {
          await timeout(5000);
          return false;
        }} />
      </div>
    </div>
  )
}