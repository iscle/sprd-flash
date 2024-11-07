import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

export const BaseScreen = styled(Stack)(({ theme }) => ({
  height: 'calc(100dvh - var(--appbar-height, 64px))',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  [theme.breakpoints.up('md')]: {
    paddingInline: '10%'
  },
}));

export const StyledBaseScreen = styled(BaseScreen)(({ theme }) => ({
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
