'use client'
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { GitHub } from '@mui/icons-material';
import { usePathname } from 'next/navigation';

export default function ButtonAppBar() {
  const currentPath = usePathname();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, paddingInline: 1 }}>
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
