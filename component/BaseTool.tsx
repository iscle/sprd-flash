import { PropsWithChildren } from "react"
import { StyledBaseScreen } from "./BaseScreen"
import { ContentCard } from "./ContentCard"
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type Props = {
  title: string;
} & PropsWithChildren;

export const BaseTool = ({ title, children }: Props) => (
  <StyledBaseScreen direction="column" justifyContent="space-between">
    <ContentCard>
      <Stack direction="row" alignItems="center" sx={{ padding: 1 }}>
        <IconButton aria-label={'Go home'} href='/'>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ flexGrow: 1, paddingInline: 1 }}>
          {title}
        </Typography>
      </Stack>
      <Divider />
      <Stack
        direction="column"
        sx={{
          padding: 3,
          gap: 2,
        }}>
        {children}
      </Stack>
    </ContentCard>
  </StyledBaseScreen>
)