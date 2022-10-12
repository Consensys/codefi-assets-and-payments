import { AreaConfig, BarConfig } from '@ant-design/charts';
import { ReactNode } from 'react';

export interface ChartAction {
  callback: () => void;
  name: string;
  default?: boolean;
}
export type ChartConfig = BarConfig | AreaConfig;
export interface ChartProps {
  /**
   * Chart title
   */
  title?: string | ReactNode;

  /**
   * Chart subtitle
   */
  subTitle?: string;

  /**
   * Chart config, for more info check https://charts.ant.design/
   */
  config: ChartConfig;

  /**
   * Chart action buttons
   */
  actions?: ChartAction[];
  type: 'area' | 'line' | 'bar' | 'column';
}
