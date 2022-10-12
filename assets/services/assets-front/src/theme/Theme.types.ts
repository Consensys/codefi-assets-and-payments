export type SizeVariant = 'small' | 'medium' | 'large';
export type AlertType = 'success' | 'info' | 'warning' | 'error';

export type TypographyHeading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
export type TypographyBody = 'body1' | 'body2';
export type TypographyType = TypographyHeading | TypographyBody;

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

type TypographyVariant = {
  [key: string]:
    | string
    | {
        fontSize: string;
        fontWeight?: number;
      };
};

export type Theme = {
  palette: {
    primary: string;
    secondary: string;
    textPrimary: string;
    textSecondary: string;
    textLight: string;
    textInverted: string;
    body: string;
    bodyInverted: string;
    navigation: string;
    neutral: string;
    darkNeutral: string;
    lightNeutral: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    subTitle: string;
  };
  typography: {
    fontFamily: string;
    fontWeightLight: number;
    fontWeightNormal: number;
    fontWeightSemiBold: number;
    fontWeightBold: number;
    fontWeightExtraBold: number;
    variant: {
      [key in TypographyType]?: TypographyVariant;
    };
  };
  boxShadow: {
    [key in SizeVariant]?: string;
  };
  borderRadius: string;
  input: {
    inputHeight: string;
    borderColor: string;
    borderRadius: string;
  };
  content: {
    maxContentWidth: string;
    maxFormWidth: string;
  };
  breakpoints: {
    [key in Breakpoint]: string;
  };
  spacing: (factor: number) => string;
  screen: (breakpoint: Breakpoint | string) => string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ThemeOverride = Theme extends object
  ? {
      [P in keyof Theme]?: ThemeOverride;
    }
  : Theme;
