import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel, { StepLabelProps } from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import { Button, CircularProgress, Link, StepContent } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

type Props = {
  disabled?: boolean
  successContent?: React.ReactNode
  onWaitForDevice: () => Promise<boolean>
}

type GuidedStatus = 'pending' | 'success' | 'failed'

const DOWNLOAD_STEPS = [
  {
    text: 'Shut down the device',
    skipText: 'I\'m already in download mode'
  },
  {
    text: 'Hold the Download Mode Button',
    helperText: '(Likely Volume Down)'
  },
  {
    text: 'Continue holding the button and plug the device in',
    waitForDevice: true
  }
]


export default function GuidedDownload({ disabled, successContent, onWaitForDevice }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [status, setStatus] = React.useState<GuidedStatus>('pending');
  const allowSkip = activeStep === 0 && !disabled;

  const nextStep = () => {
    setActiveStep(activeStep + 1);
  }

  const skipToWaitStep = () => {
    const waitStep = DOWNLOAD_STEPS.findIndex((item) => item.waitForDevice);
    setActiveStep(waitStep);
  }

  const resetSteps = () => {
    setActiveStep(0);
    setStatus('pending');
  }

  React.useEffect(() => {
    if (!DOWNLOAD_STEPS[activeStep]?.waitForDevice) {
      return;
    }

    onWaitForDevice().then((response) => {
      setStatus(response ? 'success' : 'failed');
      if (response) {
        nextStep();
      }
    }).catch(() => {
      setStatus('failed');
    })
  }, [activeStep])

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} orientation="vertical" sx={disabled ? { opacity: 0.5 } : undefined}>
        {DOWNLOAD_STEPS.map((step, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: StepLabelProps = {};

          if (step.skipText && allowSkip) {
            labelProps.optional = (
              <Link variant="body2" component="button" onClick={skipToWaitStep}>
                {step.skipText}
              </Link>
            )
          } else if (step.helperText && index === activeStep) {
            labelProps.optional = (
              <Typography variant="caption">{step.helperText}</Typography>
            );
          }

          if (step.waitForDevice && index === activeStep) {
            if (status === 'pending') {
              labelProps.StepIconComponent = () => (<CircularProgress size={24} />)
            } else if (status === 'failed') {
              labelProps.StepIconProps = { error: true }
            }
          }
          return (
            <Step key={step.text} {...stepProps}>
              <StepLabel {...labelProps}>{step.text}</StepLabel>
              <StepContent>
                {!step.waitForDevice ?
                  <Button variant="contained" disabled={disabled} onClick={nextStep}>
                    Next
                  </Button>
                  : undefined
                }
                {step.waitForDevice && status === 'failed' ? (
                  <div>
                    We were unable to connect to your device.

                    <p>
                      <Button variant="contained" startIcon={<RefreshIcon />} disabled={disabled} onClick={resetSteps}>
                        Retry
                      </Button>
                    </p>
                  </div>
                ) : undefined}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === DOWNLOAD_STEPS.length && !!successContent ? (
        successContent
      ) : undefined}
    </Box>
  );
}