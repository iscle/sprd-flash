'use client'
import GuidedDownload from "@/component/GuidedDownload";

function timeout(delay: number) {
  return new Promise(res => setTimeout(res, delay));
}

export default function SampleRoute() {
  return (
    <div className="p-4">
      This is a sample route, which will always fail to connect.

      <GuidedDownload onWaitForDevice={async () => {
        await timeout(5000);
        return false;
      }} />
    </div>
  )
}