import React, { useCallback, useRef, useState } from 'react';
import { useEffect } from 'react';

import Loader from 'uiComponents/Loader';

import { currencyFormat } from 'utils/currencyFormat';

import StyledTimeSeriesLargeGraph from './StyledTimeSeriesLargeGraph';

interface IProps {
  readonly title?: React.ReactNode;
  readonly className?: React.ReactNode;
  readonly baseline?: React.ReactNode;
  readonly data?: {
    [key in TimeSeries]: Array<Array<number>>;
  };
  readonly isLoading?: boolean;
}

type TimeSeries = '24H' | '1W' | '1M' | '6M' | 'YTD' | 'ALL';

interface IState {
  currentTimeSeries: TimeSeries;
  path?: string;
  width: number;
  data?: Array<Array<number>>;
}

const TIME_SERIES: Array<TimeSeries> = ['24H', '1W', '1M', '6M', 'YTD', 'ALL'];
const GRAPH_HEIGHT = 230;
let timeout: number;

export const TimeSeriesLargeGraph: React.FC<IProps> = ({
  baseline,
  title,
  isLoading,
  className = '',
  ...props
}) => {
  const graphContainer = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<IState>({
    currentTimeSeries: 'YTD',
    width: 0,
  });

  const setTimeSeries = (series: TimeSeries) => {
    setState((s) => ({ ...s, currentTimeSeries: series }));
    processPath();
  };

  const processPath = useCallback(() => {
    const { data } = props;

    if (!data || !graphContainer.current) {
      return;
    }
    const timeSeries: number[][] = [];

    for (const series of data[state.currentTimeSeries]) {
      timeSeries.push([series[0], series[1]]);
    }

    const width = graphContainer.current.offsetWidth;
    const valuesData = timeSeries.map((entry) => entry[0]);
    const min = Math.min(...valuesData);
    const max = Math.max(...valuesData);
    const amplitude = max - min;
    const noramlizedData = valuesData.map(
      (value) => ((value - min) / amplitude) * GRAPH_HEIGHT,
    );

    const length = timeSeries.length;
    const divWidth = width / (length - 1);

    let path = `M0,${GRAPH_HEIGHT - noramlizedData[0]}`;
    timeSeries[0][2] = noramlizedData[0];
    for (let i = 1; i < length; i++) {
      path += `L${i * divWidth},${GRAPH_HEIGHT - noramlizedData[i]}`;
      timeSeries[i][2] = noramlizedData[i];
    }

    setState((s) => ({
      ...s,
      path,
      width,
      data: timeSeries,
    }));
  }, [props, state.currentTimeSeries]);

  const onResize = useCallback(() => {
    try {
      window.clearTimeout(timeout);
    } catch (error) {}
    timeout = window.setTimeout(processPath, 500);
  }, [processPath]);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    processPath();
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize, processPath]);

  useEffect(() => {
    if (!isLoading || props.data) {
      processPath();
    }
  }, [props.data, isLoading, processPath]);

  const { currentTimeSeries, path, width, data } = state;

  if (isLoading) {
    return (
      <StyledTimeSeriesLargeGraph className={`isLoading ${className}`}>
        <Loader />
      </StyledTimeSeriesLargeGraph>
    );
  }

  const xScaleDates: Array<string> = [];
  if (data) {
    for (let i = 0; i < 6; i++) {
      const date =
        data[Math.floor((i * data.length) / 6 + data.length / 12)][1];

      if (
        currentTimeSeries === 'YTD' ||
        currentTimeSeries === 'ALL' ||
        currentTimeSeries === '6M'
      ) {
        xScaleDates.push(
          new Date(date).toLocaleDateString('en-UK', {
            month: 'short',
            year: 'numeric',
          }),
        );
      } else if (currentTimeSeries === '1M' || currentTimeSeries === '1W') {
        xScaleDates.push(
          new Date(date).toLocaleDateString('fr-FR', {
            month: '2-digit',
            day: '2-digit',
          }),
        );
      } else if (currentTimeSeries === '24H') {
        xScaleDates.push(
          new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      }
    }
  }

  return (
    <StyledTimeSeriesLargeGraph className={`${className}`}>
      <header>
        <div className="title">
          {title && title}
          {baseline && baseline}
        </div>
        <menu>
          {TIME_SERIES.map((series) => (
            <button
              onClick={() => setTimeSeries(series)}
              key={series}
              className={currentTimeSeries === series ? 'active' : undefined}
            >
              {series}
            </button>
          ))}
        </menu>
      </header>

      <div className="graphContainer" ref={graphContainer}>
        {path && (
          <svg
            width={width}
            height={GRAPH_HEIGHT}
            viewBox={`0 0 ${width} ${GRAPH_HEIGHT}`}
          >
            <path d={path} />
          </svg>
        )}
        <div className="overlay">
          {data?.map((entry, index) => {
            const divWidth = width / (data?.length - 1);

            return (
              <div
                key={index}
                style={{
                  width: `${divWidth}px`,
                  left: `${index * divWidth - divWidth / 2}px`,
                }}
              >
                <div
                  className="dot"
                  style={{
                    top: `${GRAPH_HEIGHT - entry[2] - 5}px`,
                  }}
                />
                <div
                  className={`bar ${index > data.length / 2 ? 'right' : ''}`}
                >
                  <span>{currencyFormat(Number(entry[0]))}</span>
                  <span>
                    {currentTimeSeries === '1W' || currentTimeSeries === '24H'
                      ? new Date(entry[1]).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date(entry[1]).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer>
        {xScaleDates.map((value, index) => (
          <span key={value + index}>{value}</span>
        ))}
      </footer>
    </StyledTimeSeriesLargeGraph>
  );
};
