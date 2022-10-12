import { getConfig } from 'utils/configUtils';

const config = getConfig();

export const thresholdMobile = '700px';

export const spacing = {
  none: 0,
  xs: '4px',
  small: '8px',
  tight: '16px',
  tightLooser: '24px',
  regular: '32px',
  finger: '48px',
  loose: '64px',
  large: '128px',
  xl: '256px',
  xxl: '512px',
};

export const typography = {
  weightLight: 300,
  weightNormal: 400,
  weightLightMedium: 500,
  weightMedium: 600,
  weightBold: 700,
  sizeF7: '64px',
  sizeF6: '48px',
  sizeF5: '32px',
  sizeF4: '24px',
  sizeF3: '20px',
  sizeF2: '16px',
  sizeF1: '14px',
  sizeF0: '12px',
};

export const colors = {
  main: config.mainColor || '#1a5afe',
  mainLight: '#a8b2ff',
  mainLighter: '#e6e9ff',
  mainDark: '#012c8e',
  mainDarker: '#001146',
  mainText: '#191919',
  sidebarBackground: config.SIDEBAR_BACKGROUND || '#1a2233',
  sidebarBackgroundHover: config.SIDEBAR_BACKGROUND_HOVER || '#000a28',
  sidebarText: config.SIDEBAR_TEXT || '#fff',
  sidebarTextHover: config.SIDEBAR_TEXT_HOVER || '#3be3db',

  gradient1: 'linear-gradient(135deg, #2c56dd 17.68%, #3be3db 86.46%)',
  gradient2: 'linear-gradient(135deg, #1a5afe 26.52%, #f82495 91.16%)',
  gradient3:
    'linear-gradient(90deg, #1a5afe 12.5%, #3be3db 74.99%, #c0f188 100%)',
  gradient4:
    'linear-gradient(90deg, rgba(248, 36, 149, 0) 37.5%, #fbd448 100%)',

  accent1: '#d73184',
  accent1Light: '#fab6d7',
  accent2: '#ae4bcb',
  accent2Light: '#ebcdf7',
  accent3: '#6367eb',
  accent3Light: '#d4d6ff',
  accent4: '#2f837e',
  accent4Light: '#a2dedb',
  accent5: '#677e4b',
  accent5Light: '#cfe6aa',

  success: '#69bfa0',
  successLight: '#b8e5d3',
  successLighter: '#dff2ea',
  successDark: '#008055',
  successDarker: '#006647',
  successText: '#191919',

  warning: '#e8a126',
  warningLight: '#ffdea6',
  warningLighter: '#fff1d9',
  warningDark: '#cc8100',
  warningDarker: '#994d00',
  warningText: '#191919',

  error: '#e58989',
  errorLight: '#f2cece',
  errorLighter: '#faebeb',
  errorDark: '#b20000',
  errorDarker: '#990000',
  errorText: '#191919',
};
