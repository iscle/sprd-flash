'use client'
import BoltIcon from '@mui/icons-material/Bolt';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WarningIcon from '@mui/icons-material/Warning';
import { Divider, Grid2 as Grid, Typography } from '@mui/material';
import HomeCard from '@/component/HomeCard';
import { BaseScreen } from '@/component/BaseScreen';

const PRIMARY = [
  {
    text: 'Flash',
    icon: BoltIcon,
    href: '/flash',
    description: 'Flashes your device'
  },
  {
    text: 'Unlock',
    icon: LockOpenIcon,
    href: '/unlock',
    description: 'Unlocks your device'
  },
  {
    text: 'Dump EMMC',
    icon: FileDownloadIcon,
    href: '/dump-emmc',
    description: 'Reads the EMMC contents'
  },
  {
    text: 'Write EMMC',
    icon: FileUploadIcon,
    href: '/write-emmc',
    description: 'Writes data to the EMMC'
  }
]

const ADVANCED = [
  {
    text: 'Custom Payload',
    icon: WarningIcon,
    href: '/custom-payload',
    description: 'Run a custom payload on your device'
  },
  {
    text: '(Temp) UI Sandbox',
    icon: WarningIcon,
    href: '/ui-sandbox',
    description: 'This option can be safely ignored'
  }
]

export default function Home() {
  return <BaseScreen direction="column">
    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ paddingBottom: 2 }}>
      {PRIMARY.map(item => (
        <Grid key={item.text} size={4}>
          <HomeCard {...item} />
        </Grid>
      ))}
    </Grid>
    <Typography variant="body2" color="textSecondary" sx={{ paddingInline: 1 }} fontWeight={500}>
      Advanced
    </Typography>
    <Divider sx={{ marginBottom: 1 }} />
    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
      {ADVANCED.map(item => (
        <Grid key={item.text} size={4}>
          <HomeCard {...item} />
        </Grid>
      ))}
    </Grid>
  </BaseScreen>
}