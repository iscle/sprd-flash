'use client'
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AppDrawer from './AppDrawer';

import { GitHub } from '@mui/icons-material';

export default function ButtonAppBar() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <AppBar position="static">
        <Toolbar>
          <IconButton aria-label={`${drawerOpen ? 'close' : 'open'} menu drawer`} onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" className="grow px-4">
            sprd flash
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton
              aria-label="Star me on GitHub"
              color="inherit"
              href="https://github.com/iscle/sprd-flash"
            >
              <GitHub />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </Box >
  );
}
