import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

type Props = {
  text: string;
  href: string;
  description?: string;
  icon?: typeof ArrowForwardIcon;
}

export default function HomeCard({ text, href, description, icon: Icon }: Props) {
  return (
    <Link href={href} aria-label={text}>
      <Box sx={{
        minWidth: 200,
        transition: 'all 150ms ease-in-out',
        borderRadius: 1,
        '&:hover': {
          boxShadow: '0 0 0.75rem 0px var(--mui-palette-primary-main)',
          scale: 1.03
        }
      }}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
              {!!Icon ? <Icon /> : undefined}
              <Typography variant="h5" component="div">
                {text}
              </Typography>
            </Box>
            <Typography variant="body1">
              {description}
            </Typography>
          </CardContent>
          <CardActions>
            <ArrowForwardIcon sx={{ justifyContent: 'end', margin: 1, marginLeft: 'auto' }} />
          </CardActions>
        </Card>
      </Box>
    </Link>
  );
}