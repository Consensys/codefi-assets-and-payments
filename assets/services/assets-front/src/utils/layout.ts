import { Grid } from 'antd';

const mapBreakpoints = (breakpoints: any): string => {
  const matchingBreakpoints = Object.entries(breakpoints).filter(
    ([key, value]: any) => !!value,
  );
  return matchingBreakpoints.map(([breakpoint]: any) => breakpoint).join(' ');
};

export const useBreakpoint = () => {
  const breakpoints = Grid.useBreakpoint();
  const responsiveClassNames = mapBreakpoints(breakpoints);

  return {
    breakpoints,
    responsiveClassNames,
  };
};

export const formatPathName = (path: string) => {
  return path === '' ? 'Home' : path.replaceAll('-', ' ');
};
