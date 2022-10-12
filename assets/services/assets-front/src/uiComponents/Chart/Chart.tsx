import React, { ReactElement, useEffect, useState } from 'react';
import { ChartProps } from './Chart.types';
import {
  Area,
  Line,
  Bar,
  Column,
  AreaConfig,
  LineConfig,
  BarConfig,
  ColumnConfig,
} from '@ant-design/charts';
import styled from 'styled-components';

const StyledChart = styled.div`
  width: 100%;

  margin-bottom: 40px;
  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    div:first-of-type {
      display: flex;
      flex-direction: column;
      > span {
        font-size: 0.6rem;
        color: #777c8c;
        font-style: italic;
      }
    }
    div:last-of-type {
      display: flex;
      > div {
        margin-left: 10px;
        color: #777c8c;
        cursor: pointer;
      }
    }
  }
`;
const StyledChartPeriod = styled.div<{ active: boolean }>`
  ${({ active }) =>
    active && `border-bottom: 2px solid #1a5afe; color: #1a5afe!important`}
`;

export function Chart({
  title = '',
  subTitle = '',
  config,
  actions = [],
  type,
}: ChartProps): ReactElement {
  const [activeAction, setActiveAction] = useState(
    actions.findIndex((a) => a.default === true),
  );

  useEffect(() => {
    actions.forEach((a) => a.default && a.callback());
  }, [actions]);

  const renderChart = () => {
    switch (type) {
      case 'area':
        return <Area {...(config as AreaConfig)} />;
      case 'line':
        return <Line {...(config as LineConfig)} />;
      case 'bar':
        return <Bar {...(config as BarConfig)} />;
      case 'column':
        return <Column {...(config as ColumnConfig)} />;
      default:
        return null;
    }
  };
  return (
    <StyledChart>
      <div>
        <div>
          <div>{title}</div>
          <span>{subTitle}</span>
        </div>
        <div>
          {actions.map((a, i) => (
            <StyledChartPeriod
              key={i}
              data-qa={a.name}
              active={activeAction === i}
              onClick={() => {
                a.callback();
                setActiveAction(i);
              }}
            >
              {a.name}
            </StyledChartPeriod>
          ))}
        </div>
      </div>
      {renderChart()}
    </StyledChart>
  );
}
