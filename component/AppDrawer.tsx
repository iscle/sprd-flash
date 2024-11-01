'use client'
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Typography } from "@mui/material";

import HomeIcon from '@mui/icons-material/Home';
import BoltIcon from '@mui/icons-material/Bolt';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WarningIcon from '@mui/icons-material/Warning';
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
}

type NavItemProps = {
  text: string;
  href: string;
  icon?: typeof HomeIcon;
}

const PRIMARY = [
  {
    text: 'Home',
    icon: HomeIcon,
    href: '/'
  },
  {
    text: 'Flash',
    icon: BoltIcon,
    href: '/flash'
  },
  {
    text: 'Unlock',
    icon: LockOpenIcon,
    href: '/unlock'
  },
  {
    text: 'Dump EMMC',
    icon: FileDownloadIcon,
    href: '/dump-emmc'
  },
  {
    text: 'Write EMMC',
    icon: FileUploadIcon,
    href: '/write-emmc'
  }
] as NavItemProps[]

const ADVANCED = [
  {
    text: 'Custom Payload',
    icon: WarningIcon,
    href: '/custom-payload'
  }
] as NavItemProps[]

function NavItem({ text, icon: Icon, href, active }: NavItemProps & { active?: boolean }) {
  return (
    <ListItem disablePadding>
      <ListItemButton selected={active} LinkComponent={Link} href={href}>
        {Icon ? <ListItemIcon>
          <Icon />
        </ListItemIcon> : undefined}
        <ListItemText primary={text} />
      </ListItemButton>
    </ListItem>
  )
}

export default function AppDrawer({ open, onClose }: Props) {
  const currentPath = usePathname();

  return (
    <Drawer open={open} onClose={onClose}>
      <Box sx={{ width: 250 }} role="presentation" onClick={onClose}>
        <List>
          {PRIMARY.map((navItem) => (
            <NavItem
              key={navItem.text}
              {...navItem}
              active={navItem.href === currentPath}
            />
          ))}
        </List>
        <Divider />
        <List>
          <Typography variant="body2" color="textSecondary" sx={{ paddingInline: 1 }} fontWeight={500}>Advanced</Typography>
          {ADVANCED.map((navItem) => (
            <NavItem
              key={navItem.text}
              {...navItem}
              active={navItem.href === currentPath}
            />
          ))}
        </List>
      </Box>
    </Drawer>
  )
}