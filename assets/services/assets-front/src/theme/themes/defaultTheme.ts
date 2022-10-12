import { Breakpoint, Theme } from '../Theme.types';

export const defaultTheme: Theme = {
  palette: {
    primary: '#1a5afe',
    secondary: '#3be3db',
    textPrimary: '#000a28',
    textSecondary: '#475166',
    textLight: '#989ca6',
    textInverted: '#ffffff',
    body: '#ffffff',
    bodyInverted: '#000a28',
    navigation: '#1a2233',
    neutral: '#f8f8f9',
    darkNeutral: '#dfe0e5',
    lightNeutral: '#f4f4f4',
    success: '#008055',
    error: '#b20000',
    warning: '#856404',
    info: '#6a1b9a',
    subTitle: '#777C8C',
  },
  typography: {
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    fontWeightLight: 300,
    fontWeightNormal: 350,
    fontWeightSemiBold: 400,
    fontWeightBold: 500,
    fontWeightExtraBold: 550,
    variant: {
      h1: {
        fontSize: '2rem',
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: '600',
      },
      h3: {
        fontSize: '1.25rem',
      },
      h4: {
        fontSize: '1.15rem',
      },
      h5: {
        fontSize: '1rem',
      },
      body1: {
        fontSize: '1rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
    },
  },
  boxShadow: {
    medium: '0 4px 10px 0 rgba(0,0,0,0.05)',
  },
  borderRadius: '4px',
  input: {
    inputHeight: '3rem',
    borderColor: '#c2c4cc',
    borderRadius: '4px',
  },
  content: {
    maxContentWidth: '1920px',
    maxFormWidth: '426px',
  },
  spacing: (factor: number): string => `${4 * factor}px`,
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
  screen: (breakpoint: Breakpoint | string): string =>
    `@media (min-width: ${
      defaultTheme.breakpoints[breakpoint as Breakpoint] || breakpoint
    })`,
};
