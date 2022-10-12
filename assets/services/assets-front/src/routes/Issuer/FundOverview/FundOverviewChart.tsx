import React, { ReactElement } from 'react';
import { Chart } from 'uiComponents/Chart';
import { getTokenCurrency } from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { IToken } from '../AssetIssuance/templatesTypes';

enum Period {
  YEARLY,
  MONTHLY,
  WEEKLY,
}

export type ChartData = {
  t: string;
  quantity: number;
  price: number;
};

interface FundOverviewChartProps {
  chartData: ChartData[];
  token: IToken;
  title: ReactElement;
}

export function FundOverviewChart({
  chartData,
  token,
  title,
}: FundOverviewChartProps): ReactElement {
  const [chartPeriodData, setChartPeriodData] = React.useState<ChartData[]>([]);
  const [period, setChartPeriod] = React.useState(Period.YEARLY);

  const getYTD = (chartData: ChartData[]) => {
    const newYear = new Date(new Date().getFullYear(), 0, 1);
    return chartData.filter((p) => new Date(p.t) > newYear);
  };

  React.useEffect(() => {
    setChartPeriodData(getYTD(chartData));
  }, [chartData]);

  const formatLabel = (x: string, ind: number) => {
    const date = new Date(x);
    switch (period) {
      case Period.WEEKLY: {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
        });
      }
      case Period.MONTHLY: {
        if (ind % 5 === 0) {
          return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
          });
        }
        return '';
      }
      case Period.YEARLY: {
        if (date.getDate() % 16 === 0) {
          return date.toLocaleString('en-US', {
            month: 'short',
          });
        }
        return '';
      }
      default:
        return '';
    }
  };

  return (
    <Chart
      type="area"
      title={title}
      config={{
        data: chartPeriodData,
        xField: 't',
        yField: 'price',
        height: 330,
        meta: {
          volume: {
            type: 'quantile',
            min: 0,
            nice: true,
          },
        },
        xAxis: {
          label: {
            autoHide: false,
            autoRotate: false,
            formatter: (x: string, item: any, ind: number) =>
              formatLabel(x, ind),
            style: {
              fontSize: 14,
              fontWeight: 700,
              fill: '#777C8C',
            },
          },
        },
        yAxis: {
          range: [0, 0.96],
          label: {
            formatter: () => '',
          },
          grid: {
            line: {
              style: {
                stroke: 'white',
              },
            },
          },
        },
        tooltip: {
          showTitle: false,
          formatter: (datum: Record<string, string>) => ({
            name: new Date(datum.t).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            }),
            value: currencyFormat(
              parseInt(datum.price),
              getTokenCurrency(token),
            ),
          }),
        },
      }}
      actions={[
        {
          name: '1W',
          callback: () => {
            setChartPeriod(Period.WEEKLY);
            setChartPeriodData(
              chartData.slice(Math.max(chartData.length - 7, 0)),
            );
          },
        },
        {
          name: '1M',
          callback: () => {
            setChartPeriod(Period.MONTHLY);
            setChartPeriodData(
              chartData.slice(Math.max(chartData.length - 30, 0)),
            );
          },
        },
        {
          name: '6M',
          callback: () => {
            setChartPeriod(Period.YEARLY);
            setChartPeriodData(
              chartData.slice(Math.max(chartData.length - 180, 0)),
            );
          },
        },
        {
          name: 'YTD',
          default: true,
          callback: () => {
            setChartPeriod(Period.YEARLY);
            setChartPeriodData(getYTD(chartData));
          },
        },
        {
          name: '1Y',
          callback: () => {
            setChartPeriod(Period.YEARLY);
            setChartPeriodData(chartData);
          },
        },
      ]}
    />
  );
}
